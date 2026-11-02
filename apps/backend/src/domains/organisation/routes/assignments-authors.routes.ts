import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import {
  requireAuthPreHandler,
  getEffectiveUserId,
  type RequestWithUser,
} from '../../auth/middleware.js';
import { requireNotDemoMutatingPreHandler } from '../../../config/demoModeGuard.js';
import { enqueueOrgNotificationSafe } from '../../notifications/services/orgNotificationService.js';
import {
  canManageTeamAuthors,
  canManageDepartmentAuthors,
  canManageCompanyAuthors,
} from '../permissions/index.js';
import { canViewScope } from '../permissions/scopeVisibility.js';
import {
  assignmentListQuerySchema,
  teamIdParamSchema,
  departmentIdParamSchema,
  companyIdParamSchema,
  teamIdUserIdParamSchema,
  departmentIdUserIdParamSchema,
  companyIdUserIdParamSchema,
  addAssignmentBodySchema,
} from '../schemas/assignments.js';
import {
  demoteCompanyAuthorToMember,
  demoteDepartmentAuthorToMember,
  demoteTeamAuthorToMember,
  listCompanyAuthorsPage,
  listDepartmentAuthorsPage,
  listTeamAuthorsPage,
  promoteCompanyMemberToAuthorAfterVerify,
  promoteDepartmentMemberToAuthorAfterVerify,
  promoteTeamMemberToAuthorAfterVerify,
} from './assignments-route-helpers.js';

const assignmentsAuthorsRoutes: FastifyPluginAsync = (app: FastifyInstance) => {
  app.get(
    '/teams/:teamId/authors',
    { preHandler: requireAuthPreHandler },
    async (request, reply) => {
      const { teamId } = teamIdParamSchema.parse(request.params);
      const query = assignmentListQuerySchema.parse(request.query);
      const userId = getEffectiveUserId(request as RequestWithUser);
      const allowed = await canViewScope(request.server.prisma, userId, { type: 'team', teamId });
      if (!allowed) return reply.status(403).send({ error: 'No access to this team' });
      const { items, total } = await listTeamAuthorsPage(request.server.prisma, teamId, query);
      return reply.send({ items, total, limit: query.limit, offset: query.offset });
    }
  );

  app.post(
    '/teams/:teamId/authors',
    { preHandler: [requireAuthPreHandler, requireNotDemoMutatingPreHandler] },
    async (request, reply) => {
      const { teamId } = teamIdParamSchema.parse(request.params);
      const body = addAssignmentBodySchema.parse(request.body);
      const userId = getEffectiveUserId(request as RequestWithUser);
      const allowed = await canManageTeamAuthors(request.server.prisma, userId, teamId);
      if (!allowed) return reply.status(403).send({ error: 'Permission denied' });
      const ok = await promoteTeamMemberToAuthorAfterVerify(
        request.server.prisma,
        teamId,
        body.userId,
        reply
      );
      if (!ok) return;
      const team = await request.server.prisma.team.findUnique({
        where: { id: teamId },
        select: { id: true, name: true },
      });
      if (team != null) {
        enqueueOrgNotificationSafe(request.log, {
          eventType: 'team-author-assigned',
          targetUserIds: [body.userId],
          actorUserId: userId,
          payload: {
            userId: body.userId,
            scopeType: 'team',
            scopeId: teamId,
            scopeName: team.name,
          },
        });
      }
      return reply.status(201).send({ teamId, userId: body.userId });
    }
  );

  app.delete(
    '/teams/:teamId/authors/:userId',
    { preHandler: [requireAuthPreHandler, requireNotDemoMutatingPreHandler] },
    async (request, reply) => {
      const { teamId, userId: targetUserId } = teamIdUserIdParamSchema.parse(request.params);
      const actorUserId = getEffectiveUserId(request as RequestWithUser);
      const allowed = await canManageTeamAuthors(request.server.prisma, actorUserId, teamId);
      if (!allowed) return reply.status(403).send({ error: 'Permission denied' });
      const ok = await demoteTeamAuthorToMember(request.server.prisma, teamId, targetUserId, reply);
      if (!ok) return;
      const team = await request.server.prisma.team.findUnique({
        where: { id: teamId },
        select: { id: true, name: true },
      });
      if (team != null) {
        enqueueOrgNotificationSafe(request.log, {
          eventType: 'team-author-removed',
          targetUserIds: [targetUserId],
          actorUserId,
          payload: {
            userId: targetUserId,
            scopeType: 'team',
            scopeId: teamId,
            scopeName: team.name,
          },
        });
      }
      return reply.status(204).send();
    }
  );

  app.get(
    '/departments/:departmentId/authors',
    { preHandler: requireAuthPreHandler },
    async (request, reply) => {
      const { departmentId } = departmentIdParamSchema.parse(request.params);
      const query = assignmentListQuerySchema.parse(request.query);
      const userId = getEffectiveUserId(request as RequestWithUser);
      const allowed = await canViewScope(request.server.prisma, userId, {
        type: 'department',
        departmentId,
      });
      if (!allowed) return reply.status(403).send({ error: 'No access to this department' });
      const { items, total } = await listDepartmentAuthorsPage(
        request.server.prisma,
        departmentId,
        query
      );
      return reply.send({ items, total, limit: query.limit, offset: query.offset });
    }
  );

  app.post(
    '/departments/:departmentId/authors',
    { preHandler: [requireAuthPreHandler, requireNotDemoMutatingPreHandler] },
    async (request, reply) => {
      const { departmentId } = departmentIdParamSchema.parse(request.params);
      const body = addAssignmentBodySchema.parse(request.body);
      const userId = getEffectiveUserId(request as RequestWithUser);
      const allowed = await canManageDepartmentAuthors(request.server.prisma, userId, departmentId);
      if (!allowed) return reply.status(403).send({ error: 'Permission denied' });
      const ok = await promoteDepartmentMemberToAuthorAfterVerify(
        request.server.prisma,
        departmentId,
        body.userId,
        reply
      );
      if (!ok) return;
      const department = await request.server.prisma.department.findUnique({
        where: { id: departmentId },
        select: { id: true, name: true },
      });
      if (department != null) {
        enqueueOrgNotificationSafe(request.log, {
          eventType: 'department-author-assigned',
          targetUserIds: [body.userId],
          actorUserId: userId,
          payload: {
            userId: body.userId,
            scopeType: 'department',
            scopeId: departmentId,
            scopeName: department.name,
          },
        });
      }
      return reply.status(201).send({ departmentId, userId: body.userId });
    }
  );

  app.delete(
    '/departments/:departmentId/authors/:userId',
    { preHandler: [requireAuthPreHandler, requireNotDemoMutatingPreHandler] },
    async (request, reply) => {
      const { departmentId, userId: targetUserId } = departmentIdUserIdParamSchema.parse(
        request.params
      );
      const actorUserId = getEffectiveUserId(request as RequestWithUser);
      const allowed = await canManageDepartmentAuthors(
        request.server.prisma,
        actorUserId,
        departmentId
      );
      if (!allowed) return reply.status(403).send({ error: 'Permission denied' });
      const ok = await demoteDepartmentAuthorToMember(
        request.server.prisma,
        departmentId,
        targetUserId,
        reply
      );
      if (!ok) return;
      const department = await request.server.prisma.department.findUnique({
        where: { id: departmentId },
        select: { id: true, name: true },
      });
      if (department != null) {
        enqueueOrgNotificationSafe(request.log, {
          eventType: 'department-author-removed',
          targetUserIds: [targetUserId],
          actorUserId,
          payload: {
            userId: targetUserId,
            scopeType: 'department',
            scopeId: departmentId,
            scopeName: department.name,
          },
        });
      }
      return reply.status(204).send();
    }
  );

  app.get(
    '/companies/:companyId/authors',
    { preHandler: requireAuthPreHandler },
    async (request, reply) => {
      const { companyId } = companyIdParamSchema.parse(request.params);
      const query = assignmentListQuerySchema.parse(request.query);
      const userId = getEffectiveUserId(request as RequestWithUser);
      const allowed = await canViewScope(request.server.prisma, userId, {
        type: 'company',
        companyId,
      });
      if (!allowed) return reply.status(403).send({ error: 'No access to this company' });
      const { items, total } = await listCompanyAuthorsPage(
        request.server.prisma,
        companyId,
        query
      );
      return reply.send({ items, total, limit: query.limit, offset: query.offset });
    }
  );

  app.post(
    '/companies/:companyId/authors',
    { preHandler: [requireAuthPreHandler, requireNotDemoMutatingPreHandler] },
    async (request, reply) => {
      const { companyId } = companyIdParamSchema.parse(request.params);
      const body = addAssignmentBodySchema.parse(request.body);
      const userId = getEffectiveUserId(request as RequestWithUser);
      const allowed = await canManageCompanyAuthors(request.server.prisma, userId, companyId);
      if (!allowed) return reply.status(403).send({ error: 'Permission denied' });
      const ok = await promoteCompanyMemberToAuthorAfterVerify(
        request.server.prisma,
        companyId,
        body.userId,
        reply
      );
      if (!ok) return;
      const company = await request.server.prisma.company.findUnique({
        where: { id: companyId },
        select: { id: true, name: true },
      });
      if (company != null) {
        enqueueOrgNotificationSafe(request.log, {
          eventType: 'company-author-assigned',
          targetUserIds: [body.userId],
          actorUserId: userId,
          payload: {
            userId: body.userId,
            scopeType: 'company',
            scopeId: companyId,
            scopeName: company.name,
          },
        });
      }
      return reply.status(201).send({ companyId, userId: body.userId });
    }
  );

  app.delete(
    '/companies/:companyId/authors/:userId',
    { preHandler: [requireAuthPreHandler, requireNotDemoMutatingPreHandler] },
    async (request, reply) => {
      const { companyId, userId: targetUserId } = companyIdUserIdParamSchema.parse(request.params);
      const actorUserId = getEffectiveUserId(request as RequestWithUser);
      const allowed = await canManageCompanyAuthors(request.server.prisma, actorUserId, companyId);
      if (!allowed) return reply.status(403).send({ error: 'Permission denied' });
      const ok = await demoteCompanyAuthorToMember(
        request.server.prisma,
        companyId,
        targetUserId,
        reply
      );
      if (!ok) return;
      const company = await request.server.prisma.company.findUnique({
        where: { id: companyId },
        select: { id: true, name: true },
      });
      if (company != null) {
        enqueueOrgNotificationSafe(request.log, {
          eventType: 'company-author-removed',
          targetUserIds: [targetUserId],
          actorUserId,
          payload: {
            userId: targetUserId,
            scopeType: 'company',
            scopeId: companyId,
            scopeName: company.name,
          },
        });
      }
      return reply.status(204).send();
    }
  );

  return Promise.resolve();
};

export default assignmentsAuthorsRoutes;
