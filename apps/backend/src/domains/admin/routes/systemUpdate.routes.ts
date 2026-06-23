import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { requireAuthPreHandler, requireAdminPreHandler } from '../../auth/middleware.js';
import {
  adminSystemCheckUpdatesResponseSchema,
  adminSystemUpdateStatusSchema,
} from '../schemas/systemUpdate.js';
import {
  checkAdminSystemUpdatesAndNotify,
  getAdminSystemUpdateStatus,
} from '../services/adminSystemUpdateService.js';

const adminSystemUpdateRoutes: FastifyPluginAsync = (app: FastifyInstance) => {
  const preAdmin = [requireAuthPreHandler, requireAdminPreHandler];

  app.get('/admin/system/update-status', { preHandler: preAdmin }, async (_request, reply) => {
    const status = await getAdminSystemUpdateStatus();
    return reply.send(adminSystemUpdateStatusSchema.parse(status));
  });

  app.post('/admin/system/check-updates', { preHandler: preAdmin }, async (request, reply) => {
    const result = await checkAdminSystemUpdatesAndNotify(request.server.prisma);
    return reply.send(adminSystemCheckUpdatesResponseSchema.parse(result));
  });

  return Promise.resolve();
};

export default adminSystemUpdateRoutes;
