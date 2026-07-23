import type { FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import {
  requireAuthPreHandler,
  getEffectiveUserId,
  type RequestWithUser,
} from '../../auth/middleware.js';
import { z } from 'zod';
import {
  companyIdParamSchema,
  departmentIdParamSchema,
  teamIdParamSchema,
} from '../schemas/organisation.js';
import {
  setStartDocument,
  clearStartDocument,
  type StartHereScopeType,
} from '../services/startHereService.js';

const setStartDocumentBodySchema = z.object({
  documentId: z.cuid(),
});

async function handleSet(
  request: FastifyRequest,
  reply: FastifyReply,
  scopeType: StartHereScopeType,
  scopeId: string
) {
  const userId = getEffectiveUserId(request as RequestWithUser);
  const body = setStartDocumentBodySchema.parse(request.body);
  const result = await setStartDocument(
    request.server.prisma,
    userId,
    scopeType,
    scopeId,
    body.documentId
  );
  if (!result.ok) {
    return reply.status(result.status).send({ error: result.error });
  }
  return reply.status(204).send();
}

async function handleClear(
  request: FastifyRequest,
  reply: FastifyReply,
  scopeType: StartHereScopeType,
  scopeId: string
) {
  const userId = getEffectiveUserId(request as RequestWithUser);
  const result = await clearStartDocument(request.server.prisma, userId, scopeType, scopeId);
  if (!result.ok) {
    return reply.status(result.status).send({ error: result.error });
  }
  return reply.status(204).send();
}

const startHereRoutes: FastifyPluginAsync = (app: FastifyInstance): Promise<void> => {
  app.put(
    '/teams/:teamId/start-document',
    { preHandler: requireAuthPreHandler },
    async (request, reply) => {
      const { teamId } = teamIdParamSchema.parse(request.params);
      return handleSet(request, reply, 'team', teamId);
    }
  );
  app.delete(
    '/teams/:teamId/start-document',
    { preHandler: requireAuthPreHandler },
    async (request, reply) => {
      const { teamId } = teamIdParamSchema.parse(request.params);
      return handleClear(request, reply, 'team', teamId);
    }
  );

  app.put(
    '/departments/:departmentId/start-document',
    { preHandler: requireAuthPreHandler },
    async (request, reply) => {
      const { departmentId } = departmentIdParamSchema.parse(request.params);
      return handleSet(request, reply, 'department', departmentId);
    }
  );
  app.delete(
    '/departments/:departmentId/start-document',
    { preHandler: requireAuthPreHandler },
    async (request, reply) => {
      const { departmentId } = departmentIdParamSchema.parse(request.params);
      return handleClear(request, reply, 'department', departmentId);
    }
  );

  app.put(
    '/companies/:companyId/start-document',
    { preHandler: requireAuthPreHandler },
    async (request, reply) => {
      const { companyId } = companyIdParamSchema.parse(request.params);
      return handleSet(request, reply, 'company', companyId);
    }
  );
  app.delete(
    '/companies/:companyId/start-document',
    { preHandler: requireAuthPreHandler },
    async (request, reply) => {
      const { companyId } = companyIdParamSchema.parse(request.params);
      return handleClear(request, reply, 'company', companyId);
    }
  );
  return Promise.resolve();
};

export { startHereRoutes };
