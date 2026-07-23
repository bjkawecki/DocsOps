import type { FastifyInstance } from 'fastify';
import {
  requireAuthPreHandler,
  getEffectiveUserId,
  type RequestWithUser,
} from '../../../auth/middleware.js';
import { mePulseQuerySchema, pulseItemIdParamSchema } from '../../schemas/me.js';
import { getMePulse, markPulseItemRead } from '../../services/pulseService.js';
import { getMePulseExplore } from '../../services/pulseExploreService.js';

function registerMePulseRoutes(app: FastifyInstance): void {
  app.get('/me/pulse', { preHandler: requireAuthPreHandler }, async (request, reply) => {
    const userId = getEffectiveUserId(request as RequestWithUser);
    const query = mePulseQuerySchema.parse(request.query);
    const user = await request.server.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { preferences: true },
    });
    const pulse = await getMePulse(request.server.prisma, userId, user.preferences, query);
    return reply.send(pulse);
  });

  app.get('/me/pulse/explore', { preHandler: requireAuthPreHandler }, async (request, reply) => {
    const userId = getEffectiveUserId(request as RequestWithUser);
    const explore = await getMePulseExplore(request.server.prisma, userId);
    return reply.send(explore);
  });

  app.post<{ Params: { itemId: string } }>(
    '/me/pulse/items/:itemId/read',
    { preHandler: requireAuthPreHandler },
    async (request, reply) => {
      const userId = getEffectiveUserId(request as RequestWithUser);
      const { itemId } = pulseItemIdParamSchema.parse(request.params);
      const result = await markPulseItemRead(request.server.prisma, userId, itemId);
      if (!result.ok) {
        return reply.status(result.status).send({ error: result.error });
      }
      return reply.status(204).send();
    }
  );
}

export { registerMePulseRoutes };
