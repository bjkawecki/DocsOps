import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { requireAuthPreHandler, requireAdminPreHandler } from '../../auth/middleware.js';
import { adminUpdateApplyResponseSchema, adminUpdateRunSchema } from '../schemas/updates.js';
import {
  getAdminUpdateApplyResult,
  startAdminSystemUpdateApply,
} from '../services/adminSystemUpdateApplyService.js';
import { getActiveUpdateRun } from '../services/adminUpdateRunService.js';

const adminUpdatesRoutes: FastifyPluginAsync = (app: FastifyInstance) => {
  const preAdmin = [requireAuthPreHandler, requireAdminPreHandler];

  app.post('/admin/updates/apply', { preHandler: preAdmin }, async (request, reply) => {
    try {
      const result = await startAdminSystemUpdateApply(request.server.prisma, request.user!.id);
      return reply.status(202).send(adminUpdateApplyResponseSchema.parse(result));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not start update';
      if (
        message.includes('already in progress') ||
        message.includes('not configured') ||
        message.includes('not available') ||
        message.includes('No update') ||
        message.includes('disabled')
      ) {
        return reply.status(409).send({ error: message });
      }
      if (message.includes('MinIO') || message.includes('BACKUP_ENCRYPTION')) {
        return reply.status(400).send({ error: message });
      }
      return reply.status(500).send({ error: message });
    }
  });

  app.get('/admin/updates/active', { preHandler: preAdmin }, async (request, reply) => {
    const run = await getActiveUpdateRun(request.server.prisma);
    return reply.send({ run: run ? adminUpdateRunSchema.parse(run) : null });
  });

  app.get('/admin/updates/:id', { preHandler: preAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const run = await getAdminUpdateApplyResult(request.server.prisma, id);
    if (!run) {
      return reply.status(404).send({ error: 'Update run not found' });
    }
    return reply.send(adminUpdateRunSchema.parse(run));
  });

  return Promise.resolve();
};

export default adminUpdatesRoutes;
