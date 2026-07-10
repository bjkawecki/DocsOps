import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import {
  requireAuthPreHandler,
  getEffectiveUserId,
  type RequestWithUser,
} from '../../auth/middleware.js';
import { canManageTeamAuthors, canManageDepartmentAuthors } from '../permissions/index.js';
import { canViewScope } from '../permissions/scopeVisibility.js';
import {
  assignmentListQuerySchema,
  teamIdParamSchema,
  departmentIdParamSchema,
  teamIdUserIdParamSchema,
  departmentIdUserIdParamSchema,
  addAssignmentBodySchema,
  demoteDepartmentAuthorQuerySchema,
} from '../schemas/assignments.js';
import {
  demoteDepartmentAuthorToMember,
  demoteTeamAuthorToMember,
  listDepartmentAuthorsPage,
  listTeamAuthorsPage,
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
    { preHandler: requireAuthPreHandler },
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
      return reply.status(201).send({ teamId, userId: body.userId });
    }
  );

  app.delete(
    '/teams/:teamId/authors/:userId',
    { preHandler: requireAuthPreHandler },
    async (request, reply) => {
      const { teamId, userId: targetUserId } = teamIdUserIdParamSchema.parse(request.params);
      const actorUserId = getEffectiveUserId(request as RequestWithUser);
      const allowed = await canManageTeamAuthors(request.server.prisma, actorUserId, teamId);
      if (!allowed) return reply.status(403).send({ error: 'Permission denied' });
      const ok = await demoteTeamAuthorToMember(request.server.prisma, teamId, targetUserId, reply);
      if (!ok) return;
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
    { preHandler: requireAuthPreHandler },
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
      return reply.status(201).send({ departmentId, userId: body.userId });
    }
  );

  app.delete(
    '/departments/:departmentId/authors/:userId',
    { preHandler: requireAuthPreHandler },
    async (request, reply) => {
      const { departmentId, userId: targetUserId } = departmentIdUserIdParamSchema.parse(
        request.params
      );
      const { teamId } = demoteDepartmentAuthorQuerySchema.parse(request.query);
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
        teamId,
        reply
      );
      if (!ok) return;
      return reply.status(204).send();
    }
  );

  return Promise.resolve();
};

export default assignmentsAuthorsRoutes;
