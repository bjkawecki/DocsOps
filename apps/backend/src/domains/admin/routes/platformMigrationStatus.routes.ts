import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { requireAuthPreHandler, requireAdminPreHandler } from '../../auth/middleware.js';
import { getPlatformMigrationStatus } from '../services/adminPlatformMigrationStatusService.js';

const adminPlatformMigrationStatusRoutes: FastifyPluginAsync = (app: FastifyInstance) => {
  const preAdmin = [requireAuthPreHandler, requireAdminPreHandler];

  app.get('/admin/platform-migration/status', { preHandler: preAdmin }, async (request, reply) => {
    const status = await getPlatformMigrationStatus(request.server.prisma);
    return reply.send(status);
  });

  return Promise.resolve();
};

export default adminPlatformMigrationStatusRoutes;
