import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { cuidSchema } from '../../../../infrastructure/validation/cuidSchema.js';
import { initStorage } from '../../../../infrastructure/storage/index.js';
import {
  getEffectiveUserId,
  requireAuthPreHandler,
  type RequestWithUser,
} from '../../../auth/middleware.js';
import {
  requestPrefersHtml,
  SCOPE_PDF_EXPORT_DOWNLOAD_ERRORS,
  scopePdfExportDownloadErrorHtml,
  type ScopePdfExportDownloadErrorCode,
} from '../../services/scopePdfExport/scopePdfExportDownloadErrors.js';
import {
  getScopePdfExportDownload,
  getScopePdfExportRunForUser,
  serializeScopePdfExportRun,
  triggerScopePdfExport,
} from '../../services/scopePdfExport/scopePdfExportService.js';

function isScopePdfExportDownloadError(error: string): error is ScopePdfExportDownloadErrorCode {
  return (Object.values(SCOPE_PDF_EXPORT_DOWNLOAD_ERRORS) as string[]).includes(error);
}

function sendScopePdfExportDownloadError(
  request: FastifyRequest,
  reply: FastifyReply,
  status: number,
  error: string
) {
  if (requestPrefersHtml(request.headers.accept) && isScopePdfExportDownloadError(error)) {
    return reply
      .type('text/html; charset=utf-8')
      .status(status)
      .send(scopePdfExportDownloadErrorHtml(error));
  }
  return reply.status(status).send({ error });
}

const contextIdParamSchema = z.object({ contextId: cuidSchema });
const runIdParamSchema = z.object({ runId: cuidSchema });

export function registerScopePdfExportRoutes(app: FastifyInstance): void {
  app.post(
    '/contexts/:contextId/pdf-export',
    { preHandler: requireAuthPreHandler },
    async (request, reply) => {
      const { contextId } = contextIdParamSchema.parse(request.params);
      const userId = getEffectiveUserId(request as RequestWithUser);
      const result = await triggerScopePdfExport(request.server.prisma, { contextId, userId });
      if (!result.ok) {
        return reply.status(result.status).send({ error: result.error });
      }
      return reply.status(202).send({ runId: result.runId, jobId: result.jobId });
    }
  );

  app.get(
    '/scope-pdf-exports/:runId',
    { preHandler: requireAuthPreHandler },
    async (request, reply) => {
      const { runId } = runIdParamSchema.parse(request.params);
      const userId = getEffectiveUserId(request as RequestWithUser);
      const run = await getScopePdfExportRunForUser(request.server.prisma, runId, userId);
      if (!run) return reply.status(404).send({ error: 'Export not found' });
      return reply.send(serializeScopePdfExportRun(run));
    }
  );

  app.get(
    '/scope-pdf-exports/:runId/download',
    { preHandler: requireAuthPreHandler },
    async (request, reply) => {
      const { runId } = runIdParamSchema.parse(request.params);
      const userId = getEffectiveUserId(request as RequestWithUser);
      const download = await getScopePdfExportDownload(request.server.prisma, runId, userId);
      if (!download.ok) {
        return sendScopePdfExportDownloadError(request, reply, download.status, download.error);
      }
      const storage = await initStorage();
      if (!storage) {
        return sendScopePdfExportDownloadError(
          request,
          reply,
          503,
          SCOPE_PDF_EXPORT_DOWNLOAD_ERRORS.STORAGE_UNAVAILABLE
        );
      }
      const object = await storage.getObject(download.objectKey);
      if (!object) {
        return sendScopePdfExportDownloadError(
          request,
          reply,
          404,
          SCOPE_PDF_EXPORT_DOWNLOAD_ERRORS.OBJECT_MISSING
        );
      }
      reply.header('Content-Type', 'application/zip');
      reply.header('Content-Disposition', `attachment; filename="${download.fileName}"`);
      return reply.send(object.Body);
    }
  );
}
