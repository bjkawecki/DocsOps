import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import {
  requireAuthPreHandler,
  requireAdminPreHandler,
  type RequestWithUser,
} from '../../auth/middleware.js';
import {
  listPlatformExportRunsQuerySchema,
  platformExportPushBodySchema,
  platformExportRunIdParamSchema,
} from '../schemas/platformMigration.js';
import {
  deletePlatformExportRun,
  getPlatformExportDownload,
  getPlatformExportRun,
  listPlatformExportRuns,
  triggerPlatformExport,
} from '../services/adminPlatformExportRunService.js';
import {
  PlatformExportPushError,
  pushPlatformExportToReceiveUrl,
} from '../services/platformExportPushService.js';
import { writeAdminPlatformMigrationAudit } from '../services/adminPlatformMigrationAuditService.js';
import {
  DemoModeForbiddenError,
  requireNotDemoMutatingPreHandler,
} from '../../../config/demoModeGuard.js';

const adminPlatformExportsRoutes: FastifyPluginAsync = (app: FastifyInstance) => {
  const preAdmin = [requireAuthPreHandler, requireAdminPreHandler];
  const preAdminMutating = [...preAdmin, requireNotDemoMutatingPreHandler];

  const writeAuditSafe = async (
    request: RequestWithUser,
    args: Omit<Parameters<typeof writeAdminPlatformMigrationAudit>[1], 'actorUserId'>
  ): Promise<void> => {
    try {
      await writeAdminPlatformMigrationAudit(request.server.prisma, {
        ...args,
        actorUserId: request.user.id,
      });
    } catch (error) {
      request.log.warn({ error, action: args.action }, 'Failed to write platform migration audit');
    }
  };

  app.post('/admin/platform-exports', { preHandler: preAdminMutating }, async (request, reply) => {
    try {
      const result = await triggerPlatformExport(request.server.prisma, {
        requestedByUserId: (request as RequestWithUser).user.id,
      });
      await writeAuditSafe(request as RequestWithUser, {
        action: 'platform-export-create',
        status: 'success',
        platformExportRunId: result.platformExportRunId,
        details: { jobId: result.jobId },
      });
      return reply.status(202).send(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await writeAuditSafe(request as RequestWithUser, {
        action: 'platform-export-create',
        status: 'failed',
        details: { error: message },
      });
      if (
        message.includes('MinIO') ||
        message.includes('already in progress') ||
        message.includes('platform')
      ) {
        return reply.status(400).send({ error: message });
      }
      throw error;
    }
  });

  app.get('/admin/platform-exports', { preHandler: preAdmin }, async (request, reply) => {
    const query = listPlatformExportRunsQuerySchema.parse(request.query);
    const result = await listPlatformExportRuns(request.server.prisma, query);
    return reply.send(result);
  });

  app.get<{ Params: { id: string } }>(
    '/admin/platform-exports/:id',
    { preHandler: preAdmin },
    async (request, reply) => {
      const { id } = platformExportRunIdParamSchema.parse(request.params);
      const run = await getPlatformExportRun(request.server.prisma, id);
      if (!run) return reply.status(404).send({ error: 'Platform export not found' });
      return reply.send(run);
    }
  );

  app.get<{ Params: { id: string } }>(
    '/admin/platform-exports/:id/download',
    { preHandler: preAdmin },
    async (request, reply) => {
      const { id } = platformExportRunIdParamSchema.parse(request.params);
      const download = await getPlatformExportDownload(request.server.prisma, id);
      if (!download) return reply.status(404).send({ error: 'Export archive not available' });
      return reply
        .header('Content-Type', download.contentType)
        .header('Content-Disposition', `attachment; filename="${download.filename}"`)
        .send(download.body);
    }
  );

  app.post<{ Params: { id: string } }>(
    '/admin/platform-exports/:id/push',
    { preHandler: preAdminMutating },
    async (request, reply) => {
      const { id } = platformExportRunIdParamSchema.parse(request.params);
      const body = platformExportPushBodySchema.parse(request.body ?? {});
      try {
        const result = await pushPlatformExportToReceiveUrl(request.server.prisma, {
          platformExportRunId: id,
          receiveUrl: body.receiveUrl,
        });
        await writeAuditSafe(request as RequestWithUser, {
          action: 'platform-export-push',
          status: 'success',
          platformExportRunId: id,
          details: { bytesPushed: result.bytesPushed },
        });
        return reply.send(result);
      } catch (error) {
        if (error instanceof DemoModeForbiddenError) {
          return reply.status(403).send({ error: error.message });
        }
        const message = error instanceof Error ? error.message : String(error);
        await writeAuditSafe(request as RequestWithUser, {
          action: 'platform-export-push',
          status: 'failed',
          platformExportRunId: id,
          details: { error: message },
        });
        if (error instanceof PlatformExportPushError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  app.delete<{ Params: { id: string } }>(
    '/admin/platform-exports/:id',
    { preHandler: preAdminMutating },
    async (request, reply) => {
      const { id } = platformExportRunIdParamSchema.parse(request.params);
      try {
        const deleted = await deletePlatformExportRun(request.server.prisma, id);
        if (!deleted) return reply.status(404).send({ error: 'Platform export not found' });
        await writeAuditSafe(request as RequestWithUser, {
          action: 'platform-export-delete',
          status: 'success',
          platformExportRunId: id,
        });
        return reply.status(204).send();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return reply.status(400).send({ error: message });
      }
    }
  );
  return Promise.resolve();
};

export default adminPlatformExportsRoutes;
