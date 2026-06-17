import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import multipart from '@fastify/multipart';
import {
  requireAuthPreHandler,
  requireAdminPreHandler,
  type RequestWithUser,
} from '../../auth/middleware.js';
import {
  listRestoreRunsQuerySchema,
  restoreFromBackupParamSchema,
  restoreRunIdParamSchema,
} from '../schemas/restores.js';
import {
  getRestoreRun,
  getRestoreUploadMaxBytes,
  listRestoreRuns,
  triggerRestoreFromBackup,
  triggerRestoreFromUpload,
} from '../services/adminRestoreRunService.js';
import { writeAdminBackupAudit } from '../services/adminBackupAuditService.js';

const adminRestoresRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  const maxUploadBytes = getRestoreUploadMaxBytes();
  await app.register(multipart, {
    limits: { fileSize: maxUploadBytes, files: 1 },
  });

  const preAdmin = [requireAuthPreHandler, requireAdminPreHandler];

  const writeAuditSafe = async (
    request: RequestWithUser,
    args: Omit<Parameters<typeof writeAdminBackupAudit>[1], 'actorUserId'>
  ): Promise<void> => {
    try {
      await writeAdminBackupAudit(request.server.prisma, {
        ...args,
        actorUserId: request.user.id,
      });
    } catch (error) {
      request.log.warn({ error, action: args.action }, 'Failed to write backup audit entry');
    }
  };

  app.get('/admin/restores', { preHandler: preAdmin }, async (request, reply) => {
    const query = listRestoreRunsQuerySchema.parse(request.query);
    const result = await listRestoreRuns(request.server.prisma, query);
    return reply.send(result);
  });

  app.get<{ Params: { id: string } }>(
    '/admin/restores/:id',
    { preHandler: preAdmin },
    async (request, reply) => {
      const { id } = restoreRunIdParamSchema.parse(request.params);
      const run = await getRestoreRun(request.server.prisma, id);
      if (!run) return reply.status(404).send({ error: 'Restore not found' });
      return reply.send(run);
    }
  );

  app.post<{ Params: { backupRunId: string } }>(
    '/admin/restores/from-backup/:backupRunId',
    { preHandler: preAdmin },
    async (request, reply) => {
      const { backupRunId } = restoreFromBackupParamSchema.parse(request.params);
      try {
        const result = await triggerRestoreFromBackup(request.server.prisma, {
          backupRunId,
          triggeredByUserId: (request as RequestWithUser).user.id,
        });
        if (!result) return reply.status(404).send({ error: 'Backup not found' });
        await writeAuditSafe(request as RequestWithUser, {
          action: 'restore-create',
          status: 'success',
          restoreRunId: result.restoreRunId,
          backupRunId,
          details: { source: 'history', jobId: result.jobId },
        });
        return reply.status(202).send(result);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await writeAuditSafe(request as RequestWithUser, {
          action: 'restore-create',
          status: 'failed',
          backupRunId,
          details: { source: 'history', error: message },
        });
        if (
          message.includes('no local archive') ||
          message.includes('already in progress') ||
          message.includes('Another restore')
        ) {
          return reply.status(400).send({ error: message });
        }
        throw error;
      }
    }
  );

  app.post(
    '/admin/restores/upload',
    { preHandler: preAdmin, bodyLimit: maxUploadBytes },
    async (request, reply) => {
      const file = await request.file();
      if (!file) {
        return reply.status(400).send({ error: 'Missing file upload' });
      }

      const filename = file.filename?.trim() || 'upload.tar.zst';

      try {
        const result = await triggerRestoreFromUpload(request.server.prisma, {
          fileStream: file.file,
          triggeredByUserId: (request as RequestWithUser).user.id,
          filename,
        });
        await writeAuditSafe(request as RequestWithUser, {
          action: 'restore-create',
          status: 'success',
          restoreRunId: result.restoreRunId,
          details: { source: 'upload', jobId: result.jobId, filename },
        });
        return reply.status(202).send(result);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await writeAuditSafe(request as RequestWithUser, {
          action: 'restore-create',
          status: 'failed',
          details: { source: 'upload', error: message },
        });
        if (
          message.includes('.tar.zst') ||
          message.includes('MinIO') ||
          message.includes('already in progress') ||
          message.includes('Another restore')
        ) {
          return reply.status(400).send({ error: message });
        }
        throw error;
      }
    }
  );
};

export default adminRestoresRoutes;
