import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import {
  requireAuthPreHandler,
  requireAdminPreHandler,
  getEffectiveUserId,
  type RequestWithUser,
} from '../../auth/middleware.js';
import { hashPassword } from '../../auth/services/password.js';
import {
  createUserBodySchema,
  knowledgeManagerScopesBodySchema,
  listUserDocumentsQuerySchema,
  listUsersQuerySchema,
  resetPasswordBodySchema,
  updateUserBodySchema,
  userIdParamSchema,
} from '../schemas/users.js';
import {
  refreshContextOwnerDisplayForOwner,
  setOwnerDisplayName,
} from '../../organisation/services/contextOwnerDisplay.js';
import { GrantRole } from '../../../../generated/prisma/client.js';
import {
  enqueueAdminRoleChangeNotification,
  requireExistingAdminUserIdOr404,
  requireLocalPasswordUserIdOrRespond,
} from '../services/adminUsersRouteSupport.js';
import { listAdminUsers } from '../services/adminUsersListService.js';
import { requireNotDemoMutatingPreHandler } from '../../../config/demoModeGuard.js';
import {
  assertCanAssignScopeRole,
  ScopeAssignmentConflictError,
} from '../../organisation/services/scopeAssignmentRules.js';

const adminUsersRoutes: FastifyPluginAsync = (app: FastifyInstance) => {
  const preAdmin = [requireAuthPreHandler, requireAdminPreHandler];
  const preAdminMutating = [...preAdmin, requireNotDemoMutatingPreHandler];

  /** GET /api/v1/admin/users – Nutzerliste (paginiert, Filter, Suche, Sortierung). */
  app.get('/admin/users', { preHandler: preAdmin }, async (request, reply) => {
    const query = listUsersQuerySchema.parse(request.query);
    const result = await listAdminUsers(request.server.prisma, query);
    return reply.send(result);
  });

  /** GET /api/v1/admin/users/:userId/stats – Kennzahlen für User-Detail. */
  app.get<{ Params: { userId: string } }>(
    '/admin/users/:userId/stats',
    { preHandler: preAdmin },
    async (request, reply) => {
      const { userId } = userIdParamSchema.parse(request.params);
      const prisma = request.server.prisma;
      if (!(await requireExistingAdminUserIdOr404(prisma, userId, reply))) return;
      const [storageBytesUsed, documentsAsWriterCount, draftsCount] = await Promise.all([
        prisma.documentAttachment.aggregate({
          where: { uploadedById: userId },
          _sum: { sizeBytes: true },
        }),
        prisma.documentGrantUser.count({
          where: { userId, role: GrantRole.Write },
        }),
        prisma.document.count({
          where: {
            createdById: userId,
            publishedAt: null,
            deletedAt: null,
            archivedAt: null,
          },
        }),
      ]);
      return reply.send({
        storageBytesUsed: storageBytesUsed._sum.sizeBytes ?? 0,
        documentsAsWriterCount,
        draftsCount,
      });
    }
  );

  /** GET /api/v1/admin/users/:userId/documents – Dokumente, bei denen User Writer ist (direkte User-Grants). */
  app.get<{ Params: { userId: string } }>(
    '/admin/users/:userId/documents',
    { preHandler: preAdmin },
    async (request, reply) => {
      const { userId } = userIdParamSchema.parse(request.params);
      const query = listUserDocumentsQuerySchema.parse(request.query);
      const prisma = request.server.prisma;
      if (!(await requireExistingAdminUserIdOr404(prisma, userId, reply))) return;
      const whereDoc = {
        deletedAt: null,
        grantUser: {
          some: { userId, role: GrantRole.Write },
        },
        ...(query.search?.trim() && {
          title: { contains: query.search.trim(), mode: 'insensitive' as const },
        }),
      };
      const [items, total] = await Promise.all([
        prisma.document.findMany({
          where: whereDoc,
          select: { id: true, title: true },
          orderBy: { title: 'asc' },
          take: query.limit,
          skip: query.offset,
        }),
        prisma.document.count({ where: whereDoc }),
      ]);
      return reply.send({
        items,
        total,
        limit: query.limit,
        offset: query.offset,
      });
    }
  );

  /** POST /api/v1/admin/users – Nutzer anlegen. */
  app.post('/admin/users', { preHandler: preAdminMutating }, async (request, reply) => {
    const body = createUserBodySchema.parse(request.body);
    const existing = await request.server.prisma.user.findUnique({
      where: { email: body.email },
      select: { id: true },
    });
    if (existing) {
      return reply.status(409).send({ error: 'This email address is already in use.' });
    }
    const passwordHash = await hashPassword(body.password);
    const user = await request.server.prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        passwordHash,
        isAdmin: body.isAdmin ?? false,
        isKnowledgeManager: body.isKnowledgeManager ?? false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        isKnowledgeManager: true,
        deletedAt: true,
      },
    });
    if (user.isAdmin) {
      enqueueAdminRoleChangeNotification(request.log, {
        targetUserId: user.id,
        actorUserId: getEffectiveUserId(request as RequestWithUser),
        granted: true,
      });
    }
    return reply.status(201).send(user);
  });

  /** PATCH /api/v1/admin/users/:userId – Nutzer bearbeiten / Deaktivierung / Reaktivierung. */
  app.patch<{ Params: { userId: string } }>(
    '/admin/users/:userId',
    { preHandler: preAdminMutating },
    async (request, reply) => {
      const { userId } = userIdParamSchema.parse(request.params);
      const body = updateUserBodySchema.parse(request.body);

      const target = await request.server.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, isAdmin: true, isKnowledgeManager: true, deletedAt: true },
      });
      if (!target) {
        return reply.status(404).send({ error: 'User not found.' });
      }

      const adminCount = await request.server.prisma.user.count({
        where: { isAdmin: true, deletedAt: null },
      });
      if (body.isAdmin === false && target.isAdmin && adminCount <= 1) {
        return reply.status(403).send({
          error: 'The last administrator cannot be changed to a regular user.',
        });
      }
      if (
        body.deletedAt !== undefined &&
        body.deletedAt !== null &&
        target.isAdmin &&
        adminCount <= 1
      ) {
        return reply.status(403).send({
          error: 'The last administrator cannot be deactivated.',
        });
      }

      if (body.email !== undefined) {
        const existing = await request.server.prisma.user.findUnique({
          where: { email: body.email ?? '' },
          select: { id: true },
        });
        if (existing && existing.id !== userId) {
          return reply.status(409).send({ error: 'This email address is already in use.' });
        }
      }

      const nextIsAdmin = body.isAdmin ?? target.isAdmin;
      const nextIsKm = body.isKnowledgeManager ?? target.isKnowledgeManager;
      if (nextIsAdmin && nextIsKm) {
        return reply.status(409).send({
          error: 'A user cannot be both platform administrator and knowledge manager.',
        });
      }

      const data: {
        name?: string;
        email?: string | null;
        isAdmin?: boolean;
        isKnowledgeManager?: boolean;
        deletedAt?: Date | null;
      } = {};
      if (body.name !== undefined) data.name = body.name;
      if (body.email !== undefined) data.email = body.email;
      const actorUserId = getEffectiveUserId(request as RequestWithUser);
      const wasAdmin = target.isAdmin;

      if (body.isAdmin === true && !target.isAdmin) {
        try {
          await assertCanAssignScopeRole(request.server.prisma, {
            userId,
            kind: 'admin',
          });
        } catch (err) {
          if (err instanceof ScopeAssignmentConflictError) {
            return reply.status(409).send({ error: err.message });
          }
          throw err;
        }
      }

      if (body.isKnowledgeManager === true && !target.isKnowledgeManager) {
        try {
          await assertCanAssignScopeRole(request.server.prisma, {
            userId,
            kind: 'knowledgeManager',
          });
        } catch (err) {
          if (err instanceof ScopeAssignmentConflictError) {
            return reply.status(409).send({ error: err.message });
          }
          throw err;
        }
      }

      if (body.isAdmin !== undefined) data.isAdmin = body.isAdmin;
      if (body.isKnowledgeManager !== undefined) data.isKnowledgeManager = body.isKnowledgeManager;
      if (body.deletedAt !== undefined) {
        data.deletedAt = body.deletedAt === null ? null : new Date(body.deletedAt);
      }

      if (data.deletedAt != null) {
        await request.server.prisma.session.deleteMany({ where: { userId } });
      }

      const updated = await request.server.prisma.$transaction(async (tx) => {
        if (body.isKnowledgeManager === false && target.isKnowledgeManager) {
          await tx.knowledgeManagerCompany.deleteMany({ where: { userId } });
          await tx.knowledgeManagerDepartment.deleteMany({ where: { userId } });
          await tx.knowledgeManagerTeam.deleteMany({ where: { userId } });
        }
        if (body.isAdmin === true) {
          data.isKnowledgeManager = false;
          await tx.knowledgeManagerCompany.deleteMany({ where: { userId } });
          await tx.knowledgeManagerDepartment.deleteMany({ where: { userId } });
          await tx.knowledgeManagerTeam.deleteMany({ where: { userId } });
        }
        return tx.user.update({
          where: { id: userId },
          data,
          select: {
            id: true,
            name: true,
            email: true,
            isAdmin: true,
            isKnowledgeManager: true,
            deletedAt: true,
          },
        });
      });
      if (data.name !== undefined) {
        const prisma = request.server.prisma;
        const owners = await prisma.owner.findMany({
          where: { ownerUserId: userId },
          select: { id: true },
        });
        for (const o of owners) {
          await setOwnerDisplayName(prisma, o.id);
          await refreshContextOwnerDisplayForOwner(prisma, o.id);
        }
      }
      if (body.isAdmin !== undefined && body.isAdmin !== wasAdmin) {
        enqueueAdminRoleChangeNotification(request.log, {
          targetUserId: userId,
          actorUserId,
          granted: body.isAdmin,
        });
      }
      return reply.send(updated);
    }
  );

  /** PUT /api/v1/admin/users/:userId/knowledge-manager-scopes – replace KM scope list. */
  app.put<{ Params: { userId: string } }>(
    '/admin/users/:userId/knowledge-manager-scopes',
    { preHandler: preAdminMutating },
    async (request, reply) => {
      const { userId } = userIdParamSchema.parse(request.params);
      const body = knowledgeManagerScopesBodySchema.parse(request.body);
      const prisma = request.server.prisma;
      const target = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, isKnowledgeManager: true, isAdmin: true },
      });
      if (!target) {
        return reply.status(404).send({ error: 'User not found.' });
      }
      if (target.isAdmin || !target.isKnowledgeManager) {
        return reply.status(409).send({
          error: 'Knowledge manager scopes can only be set on knowledge manager accounts.',
        });
      }

      const [companies, departments, teams] = await Promise.all([
        body.companyIds.length
          ? prisma.company.findMany({
              where: { id: { in: body.companyIds } },
              select: { id: true },
            })
          : Promise.resolve([]),
        body.departmentIds.length
          ? prisma.department.findMany({
              where: { id: { in: body.departmentIds } },
              select: { id: true },
            })
          : Promise.resolve([]),
        body.teamIds.length
          ? prisma.team.findMany({
              where: { id: { in: body.teamIds } },
              select: { id: true },
            })
          : Promise.resolve([]),
      ]);
      if (
        companies.length !== body.companyIds.length ||
        departments.length !== body.departmentIds.length ||
        teams.length !== body.teamIds.length
      ) {
        return reply.status(400).send({ error: 'One or more scope ids are invalid.' });
      }

      await prisma.$transaction(async (tx) => {
        await tx.knowledgeManagerCompany.deleteMany({ where: { userId } });
        await tx.knowledgeManagerDepartment.deleteMany({ where: { userId } });
        await tx.knowledgeManagerTeam.deleteMany({ where: { userId } });
        if (body.companyIds.length > 0) {
          await tx.knowledgeManagerCompany.createMany({
            data: body.companyIds.map((companyId) => ({ userId, companyId })),
          });
        }
        if (body.departmentIds.length > 0) {
          await tx.knowledgeManagerDepartment.createMany({
            data: body.departmentIds.map((departmentId) => ({ userId, departmentId })),
          });
        }
        if (body.teamIds.length > 0) {
          await tx.knowledgeManagerTeam.createMany({
            data: body.teamIds.map((teamId) => ({ userId, teamId })),
          });
        }
      });

      return reply.send({
        companyIds: body.companyIds,
        departmentIds: body.departmentIds,
        teamIds: body.teamIds,
      });
    }
  );

  /** POST /api/v1/admin/users/:userId/reset-password – Admin setzt Passwort. */
  app.post<{ Params: { userId: string } }>(
    '/admin/users/:userId/reset-password',
    { preHandler: preAdminMutating },
    async (request, reply) => {
      const { userId } = userIdParamSchema.parse(request.params);
      const body = resetPasswordBodySchema.parse(request.body);
      const prisma = request.server.prisma;
      const id = await requireLocalPasswordUserIdOrRespond(
        prisma,
        userId,
        reply,
        'This user has no local login (SSO). Password cannot be set.'
      );
      if (id === undefined) return;

      const passwordHash = await hashPassword(body.newPassword);
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      });
      return reply.status(204).send();
    }
  );

  /** POST /api/v1/admin/users/:userId/reset-password/trigger – Admin löst Passwort-Reset aus (z. B. E-Mail). */
  app.post<{ Params: { userId: string } }>(
    '/admin/users/:userId/reset-password/trigger',
    { preHandler: preAdminMutating },
    async (request, reply) => {
      const { userId } = userIdParamSchema.parse(request.params);
      const id = await requireLocalPasswordUserIdOrRespond(
        request.server.prisma,
        userId,
        reply,
        'This user has no local login (SSO). Password reset is not applicable.'
      );
      if (id === undefined) return;

      // Placeholder: später z. B. Reset-Token anlegen und E-Mail versenden
      return reply.status(204).send();
    }
  );

  /** DELETE /api/v1/admin/users/:userId – Nutzer endgültig löschen (nur Admin). Irreversibel. */
  app.delete<{ Params: { userId: string } }>(
    '/admin/users/:userId',
    { preHandler: preAdminMutating },
    async (request, reply) => {
      const { userId } = userIdParamSchema.parse(request.params);
      const currentUserId = (request as RequestWithUser).user.id;
      if (currentUserId === userId) {
        return reply.status(403).send({ error: 'You cannot delete your own user account.' });
      }

      const user = await request.server.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });
      if (!user) {
        return reply.status(404).send({ error: 'User not found.' });
      }

      await request.server.prisma.session.deleteMany({ where: { userId } });
      await request.server.prisma.user.delete({ where: { id: userId } });
      return reply.status(204).send();
    }
  );

  return Promise.resolve();
};

export default adminUsersRoutes;
