import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import type { Readable } from 'node:stream';
import { platformImportReceiveTokenParamSchema } from '../schemas/platformMigration.js';
import { getPlatformImportUploadMaxBytesFromEnv } from '../services/adminPlatformImportRunService.js';
import {
  PlatformImportReceiveSlotError,
  receivePlatformImportPush,
} from '../services/platformImportReceiveService.js';
import { DemoModeForbiddenError } from '../../../config/demoModeGuard.js';
import { writeAdminPlatformMigrationAudit } from '../services/adminPlatformMigrationAuditService.js';

/**
 * Unauthenticated receive endpoint: auth is the single-use receive token in the path.
 */
const platformImportReceiveRoutes: FastifyPluginAsync = (app: FastifyInstance) => {
  const maxUploadBytes = getPlatformImportUploadMaxBytesFromEnv();

  // Pass the raw request stream through (do not buffer multi-GB archives in memory).
  app.addContentTypeParser('application/octet-stream', (_request, payload, done) => {
    done(null, payload);
  });

  app.put<{ Params: { token: string }; Body: Readable }>(
    '/platform-import-receive/:token',
    { bodyLimit: maxUploadBytes },
    async (request, reply) => {
      const { token } = platformImportReceiveTokenParamSchema.parse(request.params);
      const fileStream = request.body;
      if (fileStream == null || typeof fileStream.pipe !== 'function') {
        return reply.status(400).send({ error: 'Expected application/octet-stream body' });
      }

      try {
        const result = await receivePlatformImportPush(request.server.prisma, {
          token,
          fileStream,
        });

        if (result.platformImportRunId) {
          const triggeredBy = await request.server.prisma.platformImportRun.findUnique({
            where: { id: result.platformImportRunId },
            select: { triggeredByUserId: true },
          });
          if (triggeredBy?.triggeredByUserId) {
            await writeAdminPlatformMigrationAudit(request.server.prisma, {
              actorUserId: triggeredBy.triggeredByUserId,
              action: 'platform-import-push-received',
              status: result.preflight.ok ? 'success' : 'failed',
              platformImportRunId: result.platformImportRunId,
              details: {
                receiveSlotId: result.receiveSlotId,
                preflightOk: result.preflight.ok,
              },
            }).catch(() => undefined);
          }
        }

        return reply.status(202).send(result);
      } catch (error) {
        if (error instanceof DemoModeForbiddenError) {
          return reply.status(403).send({ error: error.message });
        }
        if (error instanceof PlatformImportReceiveSlotError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        const message = error instanceof Error ? error.message : String(error);
        request.log.warn({ err: error }, 'Platform import push receive failed');
        return reply.status(400).send({ error: message });
      }
    }
  );

  return Promise.resolve();
};

export default platformImportReceiveRoutes;
