import type { FastifyInstance } from 'fastify';
import {
  requireAuthPreHandler,
  getEffectiveUserId,
  type RequestWithUser,
} from '../../../auth/middleware.js';
import { meMoveRequestsQuerySchema } from '../../schemas/me.js';
import { listMeMoveRequests } from '../../services/meMoveRequestsService.js';

function registerMeMoveRequestsRoutes(app: FastifyInstance): void {
  app.get('/me/move-requests', { preHandler: requireAuthPreHandler }, async (request, reply) => {
    const prisma = request.server.prisma;
    const userId = getEffectiveUserId(request as RequestWithUser);
    const query = meMoveRequestsQuerySchema.parse(request.query);
    const result = await listMeMoveRequests(prisma, userId, query);
    return reply.send(result);
  });
}

export { registerMeMoveRequestsRoutes };
