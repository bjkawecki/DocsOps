import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { requireNotDemoMutatingPreHandler } from '../../../config/demoModeGuard.js';
import {
  requireAuthPreHandler,
  requireAdminPreHandler,
  getEffectiveUserId,
  type RequestWithUser,
} from '../../auth/middleware.js';
import {
  setOwnerDisplayName,
  refreshContextOwnerDisplayForOwner,
} from '../services/contextOwnerDisplay.js';
import { getVisibleCompanyIds } from '../permissions/assignmentPermissions.js';
import { canViewScope } from '../permissions/scopeVisibility.js';
import {
  paginationQuerySchema,
  createCompanyBodySchema,
  updateCompanyBodySchema,
  createDepartmentBodySchema,
  updateDepartmentBodySchema,
  createTeamBodySchema,
  updateTeamBodySchema,
  companyIdParamSchema,
  departmentIdParamSchema,
  teamIdParamSchema,
} from '../schemas/organisation.js';
import {
  listCompanyDepartmentsPaged,
  listDepartmentTeamsPaged,
} from './organisation-route-helpers.js';
import {
  assertCanAssignScopeRole,
  ScopeAssignmentConflictError,
  scopeAssignmentConflictBody,
} from '../services/scopeAssignmentRules.js';

const preAdminWrite = [
  requireAuthPreHandler,
  requireAdminPreHandler,
  requireNotDemoMutatingPreHandler,
];

const organisationRoutes: FastifyPluginAsync = (app: FastifyInstance) => {
  // --- Companies ---
  app.get('/companies', { preHandler: requireAuthPreHandler }, async (request, reply) => {
    const prisma = request.server.prisma;
    const userId = getEffectiveUserId(request as RequestWithUser);
    const query = paginationQuerySchema.parse(request.query);
    const visibleCompanyIds = await getVisibleCompanyIds(prisma, userId);
    if (visibleCompanyIds.length === 0) {
      return reply.send({ items: [], total: 0, limit: query.limit, offset: query.offset });
    }
    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where: { id: { in: visibleCompanyIds } },
        include: {
          departments: {
            include: {
              _count: { select: { teams: true } },
              departmentLeads: { include: { user: { select: { id: true, name: true } } } },
            },
          },
        },
        take: query.limit,
        skip: query.offset,
        orderBy: { name: 'asc' },
      }),
      prisma.company.count({ where: { id: { in: visibleCompanyIds } } }),
    ]);
    const items = companies.map((company) => {
      const { pdfLogoObjectKey, pdfLogoContentType, ...rest } = company;
      void pdfLogoContentType;
      return {
        ...rest,
        hasPdfLogo: pdfLogoObjectKey != null && pdfLogoObjectKey.length > 0,
      };
    });
    return reply.send({ items, total, limit: query.limit, offset: query.offset });
  });

  app.post('/companies', { preHandler: preAdminWrite }, async (request, reply) => {
    const count = await request.server.prisma.company.count();
    if (count > 0) {
      return reply.status(409).send({ error: 'Only one company can be created.' });
    }
    const body = createCompanyBodySchema.parse(request.body);
    const company = await request.server.prisma.company.create({
      data: { name: body.name },
    });
    return reply.status(201).send(company);
  });

  app.get(
    '/companies/:companyId',
    { preHandler: requireAuthPreHandler },
    async (request, reply) => {
      const prisma = request.server.prisma;
      const userId = getEffectiveUserId(request as RequestWithUser);
      const { companyId } = companyIdParamSchema.parse(request.params);
      const allowed = await canViewScope(prisma, userId, { type: 'company', companyId });
      if (!allowed)
        return reply.status(403).send({ error: 'Permission denied to view this company' });
      const company = await prisma.company.findUniqueOrThrow({
        where: { id: companyId },
        include: { departments: true },
      });
      const { pdfLogoObjectKey, pdfLogoContentType, ...rest } = company;
      void pdfLogoContentType;
      return reply.send({
        ...rest,
        hasPdfLogo: pdfLogoObjectKey != null && pdfLogoObjectKey.length > 0,
      });
    }
  );

  app.patch('/companies/:companyId', { preHandler: preAdminWrite }, async (request, reply) => {
    const prisma = request.server.prisma;
    const { companyId } = companyIdParamSchema.parse(request.params);
    const body = updateCompanyBodySchema.parse(request.body);
    const company = await prisma.company.update({
      where: { id: companyId },
      data: body,
    });
    if (Object.keys(body).length > 0) {
      const owners = await prisma.owner.findMany({
        where: { companyId },
        select: { id: true },
      });
      for (const o of owners) {
        await setOwnerDisplayName(prisma, o.id);
        await refreshContextOwnerDisplayForOwner(prisma, o.id);
      }
    }
    return reply.send(company);
  });

  app.delete('/companies/:companyId', { preHandler: preAdminWrite }, async (request, reply) => {
    const { companyId } = companyIdParamSchema.parse(request.params);
    try {
      await request.server.prisma.documentPinnedInScope.deleteMany({
        where: { scopeType: 'company', scopeId: companyId },
      });
      await request.server.prisma.company.delete({ where: { id: companyId } });
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e.code === 'P2003') {
        return reply.status(409).send({
          code: 'COMPANY_HAS_DEPARTMENTS',
          error: 'Company cannot be deleted while departments exist.',
        });
      }
      throw err;
    }
    return reply.status(204).send();
  });

  app.get(
    '/companies/:companyId/departments',
    { preHandler: requireAuthPreHandler },
    async (request, reply) => {
      const prisma = request.server.prisma;
      const userId = getEffectiveUserId(request as RequestWithUser);
      const { companyId } = companyIdParamSchema.parse(request.params);
      const query = paginationQuerySchema.parse(request.query);
      await listCompanyDepartmentsPaged(prisma, userId, companyId, query, reply);
    }
  );

  app.post(
    '/companies/:companyId/departments',
    { preHandler: preAdminWrite },
    async (request, reply) => {
      const { companyId } = companyIdParamSchema.parse(request.params);
      const body = createDepartmentBodySchema.parse(request.body);
      const prisma = request.server.prisma;
      const leadUser = await prisma.user.findUnique({
        where: { id: body.leadUserId },
        select: { id: true, deletedAt: true },
      });
      if (!leadUser || leadUser.deletedAt) {
        return reply.status(404).send({ error: 'User not found' });
      }
      try {
        await assertCanAssignScopeRole(prisma, {
          userId: body.leadUserId,
          kind: 'departmentLead',
        });
        const department = await prisma.$transaction(async (tx) => {
          const created = await tx.department.create({
            data: { name: body.name, companyId },
          });
          await tx.departmentLead.create({
            data: { departmentId: created.id, userId: body.leadUserId },
          });
          return created;
        });
        return reply.status(201).send(department);
      } catch (err) {
        if (err instanceof ScopeAssignmentConflictError) {
          return reply.status(409).send(scopeAssignmentConflictBody(err));
        }
        throw err;
      }
    }
  );

  // --- Departments (top-level by id) ---
  app.get(
    '/departments/:departmentId',
    { preHandler: requireAuthPreHandler },
    async (request, reply) => {
      const prisma = request.server.prisma;
      const userId = getEffectiveUserId(request as RequestWithUser);
      const { departmentId } = departmentIdParamSchema.parse(request.params);
      const allowed = await canViewScope(prisma, userId, { type: 'department', departmentId });
      if (!allowed)
        return reply.status(403).send({ error: 'Permission denied to view this department' });
      const department = await prisma.department.findUniqueOrThrow({
        where: { id: departmentId },
        include: { company: true, teams: true },
      });
      return reply.send(department);
    }
  );

  app.patch('/departments/:departmentId', { preHandler: preAdminWrite }, async (request, reply) => {
    const prisma = request.server.prisma;
    const { departmentId } = departmentIdParamSchema.parse(request.params);
    const body = updateDepartmentBodySchema.parse(request.body);
    const department = await prisma.department.update({
      where: { id: departmentId },
      data: body,
    });
    if (Object.keys(body).length > 0) {
      const owners = await prisma.owner.findMany({
        where: { departmentId },
        select: { id: true },
      });
      for (const o of owners) {
        await setOwnerDisplayName(prisma, o.id);
        await refreshContextOwnerDisplayForOwner(prisma, o.id);
      }
    }
    return reply.send(department);
  });

  app.delete(
    '/departments/:departmentId',
    { preHandler: preAdminWrite },
    async (request, reply) => {
      const { departmentId } = departmentIdParamSchema.parse(request.params);
      try {
        await request.server.prisma.documentPinnedInScope.deleteMany({
          where: { scopeType: 'department', scopeId: departmentId },
        });
        await request.server.prisma.department.delete({ where: { id: departmentId } });
      } catch (err: unknown) {
        const e = err as { code?: string };
        if (e.code === 'P2003') {
          return reply.status(409).send({
            code: 'DEPARTMENT_HAS_CHILDREN',
            error: 'Department cannot be deleted while it has teams or processes/projects (owner).',
          });
        }
        throw err;
      }
      return reply.status(204).send();
    }
  );

  app.get(
    '/departments/:departmentId/teams',
    { preHandler: requireAuthPreHandler },
    async (request, reply) => {
      const prisma = request.server.prisma;
      const userId = getEffectiveUserId(request as RequestWithUser);
      const { departmentId } = departmentIdParamSchema.parse(request.params);
      const query = paginationQuerySchema.parse(request.query);
      await listDepartmentTeamsPaged(prisma, userId, departmentId, query, reply);
    }
  );

  app.post(
    '/departments/:departmentId/teams',
    { preHandler: preAdminWrite },
    async (request, reply) => {
      const { departmentId } = departmentIdParamSchema.parse(request.params);
      const body = createTeamBodySchema.parse(request.body);
      const prisma = request.server.prisma;
      const department = await prisma.department.findUnique({ where: { id: departmentId } });
      if (!department) return reply.status(404).send({ error: 'Department not found' });
      const leadUser = await prisma.user.findUnique({
        where: { id: body.leadUserId },
        select: { id: true, deletedAt: true },
      });
      if (!leadUser || leadUser.deletedAt) {
        return reply.status(404).send({ error: 'User not found' });
      }
      try {
        // teamId not known yet; any non-matching id enforces "no other team lead" exclusivity.
        await assertCanAssignScopeRole(prisma, {
          userId: body.leadUserId,
          kind: 'teamLead',
          teamId: '__new_team__',
        });
        const team = await prisma.$transaction(async (tx) => {
          const created = await tx.team.create({
            data: { name: body.name, departmentId },
          });
          await tx.teamLead.create({
            data: { teamId: created.id, userId: body.leadUserId },
          });
          return created;
        });
        return reply.status(201).send(team);
      } catch (err) {
        if (err instanceof ScopeAssignmentConflictError) {
          return reply.status(409).send(scopeAssignmentConflictBody(err));
        }
        throw err;
      }
    }
  );

  // --- Teams (top-level by id) ---
  app.get('/teams/:teamId', { preHandler: requireAuthPreHandler }, async (request, reply) => {
    const prisma = request.server.prisma;
    const userId = getEffectiveUserId(request as RequestWithUser);
    const { teamId } = teamIdParamSchema.parse(request.params);
    const allowed = await canViewScope(prisma, userId, { type: 'team', teamId });
    if (!allowed) return reply.status(403).send({ error: 'Permission denied to view this team' });
    const team = await prisma.team.findUniqueOrThrow({
      where: { id: teamId },
      include: { department: { include: { company: true } } },
    });
    return reply.send(team);
  });

  app.patch('/teams/:teamId', { preHandler: preAdminWrite }, async (request, reply) => {
    const prisma = request.server.prisma;
    const { teamId } = teamIdParamSchema.parse(request.params);
    const body = updateTeamBodySchema.parse(request.body);
    const team = await prisma.team.update({
      where: { id: teamId },
      data: body,
    });
    if (Object.keys(body).length > 0) {
      const owners = await prisma.owner.findMany({
        where: { teamId },
        select: { id: true },
      });
      for (const o of owners) {
        await setOwnerDisplayName(prisma, o.id);
        await refreshContextOwnerDisplayForOwner(prisma, o.id);
      }
    }
    return reply.send(team);
  });

  app.delete('/teams/:teamId', { preHandler: preAdminWrite }, async (request, reply) => {
    const { teamId } = teamIdParamSchema.parse(request.params);
    try {
      await request.server.prisma.documentPinnedInScope.deleteMany({
        where: { scopeType: 'team', scopeId: teamId },
      });
      await request.server.prisma.team.delete({ where: { id: teamId } });
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e.code === 'P2003') {
        return reply.status(409).send({
          code: 'TEAM_HAS_CONTEXTS',
          error: 'Team cannot be deleted while processes or projects (owner) are assigned to it.',
        });
      }
      throw err;
    }
    return reply.status(204).send();
  });

  return Promise.resolve();
};

export { organisationRoutes };
