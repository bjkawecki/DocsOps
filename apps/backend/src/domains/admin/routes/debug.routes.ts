import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { isPlatformResetEnabled } from '../../../config/runtimeMode.js';
import {
  requireAuthPreHandler,
  requireAdminPreHandler,
  type RequestWithUser,
} from '../../auth/middleware.js';
import { initStorage } from '../../../infrastructure/storage/index.js';
import { resetPlatformDomainData } from '../services/resetPlatformDomainData.js';
import { reseedPlatformDomainData } from '../services/reseedPlatformDomainData.js';

function devDebugForbidden(reply: {
  status: (code: number) => { send: (body: unknown) => unknown };
}) {
  return reply.status(403).send({ error: 'This operation is only available in development' });
}

function isExpectedDevDebugClientError(message: string): boolean {
  return (
    message.includes('already in progress') ||
    message.includes('maintenance') ||
    message.includes('backup') ||
    message.includes('restore') ||
    message.includes('platform') ||
    message.includes('Destructive debug operations') ||
    message.includes('Database is not empty') ||
    message.includes('No seed CSV data') ||
    message.includes('only available in development')
  );
}

const adminDebugRoutes: FastifyPluginAsync = (app: FastifyInstance) => {
  const preAdmin = [requireAuthPreHandler, requireAdminPreHandler];

  app.post('/admin/debug/reset-platform', { preHandler: preAdmin }, async (request, reply) => {
    if (!isPlatformResetEnabled()) {
      return devDebugForbidden(reply);
    }

    try {
      const storage = await initStorage();
      const result = await resetPlatformDomainData(request.server.prisma, storage);
      request.log.info(
        { actorUserId: (request as RequestWithUser).user.id, ...result },
        'Platform domain data reset'
      );
      return reply.send(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (isExpectedDevDebugClientError(message)) {
        const status = message.includes('only available in development') ? 403 : 400;
        return reply.status(status).send({ error: message });
      }
      throw error;
    }
  });

  app.post('/admin/debug/reseed-platform', { preHandler: preAdmin }, async (request, reply) => {
    if (!isPlatformResetEnabled()) {
      return devDebugForbidden(reply);
    }

    try {
      const result = await reseedPlatformDomainData(request.server.prisma);
      request.log.info(
        { actorUserId: (request as RequestWithUser).user.id },
        'Platform data re-seeded from CSV'
      );
      return reply.send(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (isExpectedDevDebugClientError(message)) {
        const status = message.includes('only available in development') ? 403 : 400;
        return reply.status(status).send({ error: message });
      }
      throw error;
    }
  });

  return Promise.resolve();
};

export default adminDebugRoutes;
