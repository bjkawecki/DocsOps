import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import multipart from '@fastify/multipart';
import {
  requireAuthPreHandler,
  requireAdminPreHandler,
  type RequestWithUser,
} from '../../auth/middleware.js';
import {
  confirmPlatformImportBodySchema,
  listPlatformImportRunsQuerySchema,
  platformImportRunIdParamSchema,
} from '../schemas/platformMigration.js';
import {
  confirmPlatformImport,
  getPlatformImportRun,
  getPlatformImportUploadMaxBytesFromEnv,
  listPlatformImportRuns,
  runPlatformImportPreflightForRun,
  triggerPlatformImportUpload,
} from '../services/adminPlatformImportRunService.js';
import { writeAdminPlatformMigrationAudit } from '../services/adminPlatformMigrationAuditService.js';

const adminPlatformImportsRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  const maxUploadBytes = getPlatformImportUploadMaxBytesFromEnv();
  await app.register(multipart, {
    limits: { fileSize: maxUploadBytes, files: 1 },
  });

  const preAdmin = [requireAuthPreHandler, requireAdminPreHandler];

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

  app.get('/admin/platform-imports', { preHandler: preAdmin }, async (request, reply) => {
    const query = listPlatformImportRunsQuerySchema.parse(request.query);
    const result = await listPlatformImportRuns(request.server.prisma, query);
    return reply.send(result);
  });

  app.get<{ Params: { id: string } }>(
    '/admin/platform-imports/:id',
    { preHandler: preAdmin },
    async (request, reply) => {
      const { id } = platformImportRunIdParamSchema.parse(request.params);
      const run = await getPlatformImportRun(request.server.prisma, id);
      if (!run) return reply.status(404).send({ error: 'Platform import not found' });
      return reply.send(run);
    }
  );

  app.post(
    '/admin/platform-imports/upload',
    { preHandler: preAdmin, bodyLimit: maxUploadBytes },
    async (request, reply) => {
      const file = await request.file();
      if (!file) {
        return reply.status(400).send({ error: 'Missing file upload' });
      }
      const filename = file.filename?.trim() || 'upload.tar.zst';
      try {
        const result = await triggerPlatformImportUpload(request.server.prisma, {
          fileStream: file.file,
          triggeredByUserId: (request as RequestWithUser).user.id,
          filename,
        });
        await writeAuditSafe(request as RequestWithUser, {
          action: 'platform-import-upload',
          status: 'success',
          platformImportRunId: result.platformImportRunId,
          details: { filename, preflightOk: result.preflight.ok },
        });
        return reply.status(202).send(result);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await writeAuditSafe(request as RequestWithUser, {
          action: 'platform-import-upload',
          status: 'failed',
          details: { error: message, filename },
        });
        if (
          message.includes('.tar.zst') ||
          message.includes('MinIO') ||
          message.includes('already in progress')
        ) {
          return reply.status(400).send({ error: message });
        }
        throw error;
      }
    }
  );

  app.post<{ Params: { id: string } }>(
    '/admin/platform-imports/:id/preflight',
    { preHandler: preAdmin },
    async (request, reply) => {
      const { id } = platformImportRunIdParamSchema.parse(request.params);
      try {
        const result = await runPlatformImportPreflightForRun(request.server.prisma, id);
        if (!result) return reply.status(404).send({ error: 'Platform import not found' });
        await writeAuditSafe(request as RequestWithUser, {
          action: 'platform-import-preflight',
          status: result.preflight.ok ? 'success' : 'failed',
          platformImportRunId: id,
        });
        return reply.send(result);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return reply.status(400).send({ error: message });
      }
    }
  );

  app.post<{ Params: { id: string } }>(
    '/admin/platform-imports/:id/confirm',
    { preHandler: preAdmin },
    async (request, reply) => {
      const { id } = platformImportRunIdParamSchema.parse(request.params);
      const body = confirmPlatformImportBodySchema.parse(request.body ?? {});
      try {
        const result = await confirmPlatformImport(request.server.prisma, {
          platformImportRunId: id,
          triggeredByUserId: (request as RequestWithUser).user.id,
          transferPasswordHashes: body.transferPasswordHashes,
        });
        if (!result) return reply.status(404).send({ error: 'Platform import not found' });
        await writeAuditSafe(request as RequestWithUser, {
          action: 'platform-import-confirm',
          status: 'success',
          platformImportRunId: id,
          details: { jobId: result.jobId, transferPasswordHashes: body.transferPasswordHashes },
        });
        return reply.status(202).send(result);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await writeAuditSafe(request as RequestWithUser, {
          action: 'platform-import-confirm',
          status: 'failed',
          platformImportRunId: id,
          details: { error: message },
        });
        if (
          message.includes('not ready') ||
          message.includes('Preflight') ||
          message.includes('already in progress') ||
          message.includes('Password hash')
        ) {
          return reply.status(400).send({ error: message });
        }
        throw error;
      }
    }
  );
};

export default adminPlatformImportsRoutes;
