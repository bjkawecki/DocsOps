import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  requireAuthPreHandler,
  preHandlerWrap,
  getEffectiveUserId,
  type RequestWithUser,
} from '../../auth/middleware.js';
import { requireDocumentAccess } from '../permissions/index.js';
import {
  documentIdParamSchema,
  pdfExportLocaleBodySchema,
  versionIdParamSchema,
} from '../schemas/documents.js';
import { enqueueJob, getJobById } from '../../../infrastructure/jobs/client.js';
import { resolvePdfExportLocale } from '../../../infrastructure/pdf/pdfExportMeta.js';
import { buildPdfDownloadFilename } from '../services/route-support/documentRouteSupport.js';

const QUEUE_RETRY_AFTER_SECONDS = 15;
const exportPdfStatusParamsSchema = z.object({
  documentId: z.cuid(),
  jobId: z.string().min(1),
});

/** PDF download, on-demand export, and per-version PDF streaming. */
export const registerPublicationPdfRoutes = (app: FastifyInstance): void => {
  /** GET PDF download: proxy stream for internal object keys; redirect only for absolute external URLs. */
  app.get<{ Params: { documentId: string } }>(
    '/documents/:documentId/pdf',
    {
      preHandler: [requireAuthPreHandler, preHandlerWrap(requireDocumentAccess('read'))],
    },
    async (request, reply) => {
      const prisma = request.server.prisma;
      const { documentId } = documentIdParamSchema.parse(request.params);
      const doc = await prisma.document.findFirst({
        where: { id: documentId },
        select: { title: true, pdfUrl: true },
      });
      if (!doc) return reply.status(404).send({ error: 'Document not found' });
      const pdfUrl = doc.pdfUrl?.trim() ?? '';
      if (!pdfUrl) return reply.status(404).send({ error: 'PDF not available' });
      if (/^https?:\/\//i.test(pdfUrl)) {
        return reply.redirect(pdfUrl, 302);
      }
      const storage = request.server.storage;
      if (!storage) return reply.status(503).send({ error: 'Storage not available' });
      const object = await storage.getObject(pdfUrl);
      if (!object) return reply.status(404).send({ error: 'PDF object not found in storage' });
      const filename = buildPdfDownloadFilename(doc.title, documentId);
      reply.header('Content-Type', object.ContentType ?? 'application/pdf');
      reply.header('Content-Disposition', `attachment; filename="${filename}"`);
      // Stable path; content changes per export – do not let browsers reuse an old PDF.
      reply.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
      reply.header('ETag', `"${pdfUrl}"`);
      return reply.send(object.Body);
    }
  );

  /** POST PDF export job: regenerate current published version (scope lead / admin). */
  app.post<{ Params: { documentId: string } }>(
    '/documents/:documentId/export-pdf',
    {
      preHandler: [requireAuthPreHandler, preHandlerWrap(requireDocumentAccess('publish'))],
    },
    async (request, reply) => {
      const prisma = request.server.prisma;
      const userId = getEffectiveUserId(request as RequestWithUser);
      const { documentId } = documentIdParamSchema.parse(request.params);

      const doc = await prisma.document.findFirst({
        where: { id: documentId, deletedAt: null },
        select: { currentPublishedVersionId: true, publishedAt: true },
      });
      if (!doc?.publishedAt || !doc.currentPublishedVersionId) {
        return reply.status(400).send({
          error: 'PDF export requires a published version',
        });
      }

      const body = pdfExportLocaleBodySchema.parse(
        request.body != null && typeof request.body === 'object' ? request.body : {}
      );
      const requester = await prisma.user.findUnique({
        where: { id: userId },
        select: { preferences: true },
      });
      const locale = resolvePdfExportLocale({
        bodyLocale: body.locale,
        preferences: requester?.preferences,
        acceptLanguage: request.headers['accept-language'],
      });

      let jobId: string;
      try {
        jobId = await enqueueJob('documents.export.pdf', {
          documentId,
          versionId: doc.currentPublishedVersionId,
          requestedByUserId: userId,
          locale,
        });
      } catch (error) {
        request.log.warn(
          { error, documentId, userId },
          'Queue unavailable while starting PDF export job'
        );
        return reply.header('Retry-After', String(QUEUE_RETRY_AFTER_SECONDS)).status(503).send({
          error: 'Queue/worker currently unavailable. Please retry shortly.',
          code: 'QUEUE_UNAVAILABLE',
        });
      }

      return reply.status(202).send({
        jobId,
        status: 'queued',
      });
    }
  );

  /** GET PDF export job status incl. download URL when completed. */
  app.get<{ Params: { documentId: string; jobId: string } }>(
    '/documents/:documentId/export-pdf/:jobId',
    {
      preHandler: [requireAuthPreHandler, preHandlerWrap(requireDocumentAccess('read'))],
    },
    async (request, reply) => {
      const prisma = request.server.prisma;
      const { documentId, jobId } = exportPdfStatusParamsSchema.parse(request.params);

      const job = await getJobById('documents.export.pdf', jobId);
      if (!job) {
        return reply.status(404).send({ error: 'Export job not found' });
      }

      const payloadDocumentId =
        typeof job.data === 'object' && job.data != null && 'documentId' in job.data
          ? (job.data.documentId as string)
          : null;
      if (payloadDocumentId !== documentId) {
        return reply.status(404).send({ error: 'Export job not found for document' });
      }

      const doc = await prisma.document.findUnique({
        where: { id: documentId },
        select: { pdfUrl: true },
      });
      if (!doc) return reply.status(404).send({ error: 'Document not found' });

      const state = job.state;
      const isDone = state === 'completed';
      const responseStatus =
        state === 'created' || state === 'retry'
          ? 'queued'
          : state === 'active'
            ? 'running'
            : state === 'completed'
              ? 'succeeded'
              : state === 'failed'
                ? 'failed'
                : state === 'cancelled'
                  ? 'cancelled'
                  : state;

      return reply.send({
        jobId,
        status: responseStatus,
        state,
        completedAt: job.completedOn ?? null,
        failedAt: null,
        pdfReady: isDone && Boolean(doc.pdfUrl),
        downloadUrl:
          isDone && doc.pdfUrl
            ? `/api/v1/documents/${documentId}/pdf?v=${encodeURIComponent(doc.pdfUrl)}`
            : null,
        error:
          state === 'failed' && job.output && typeof job.output === 'object'
            ? 'message' in job.output
              ? (job.output.message as string)
              : 'Job failed'
            : null,
      });
    }
  );

  /** GET PDF for a published version (stored at publish / re-export). */
  app.get<{ Params: { documentId: string; versionId: string } }>(
    '/documents/:documentId/versions/:versionId/pdf',
    {
      preHandler: [requireAuthPreHandler, preHandlerWrap(requireDocumentAccess('read'))],
    },
    async (request, reply) => {
      const prisma = request.server.prisma;
      const { documentId, versionId } = versionIdParamSchema.parse(request.params);
      const version = await prisma.documentVersion.findFirst({
        where: { id: versionId, documentId },
        select: {
          pdfObjectKey: true,
          versionNumber: true,
          document: { select: { title: true } },
        },
      });
      if (!version) return reply.status(404).send({ error: 'Version not found' });
      const objectKey = version.pdfObjectKey?.trim() ?? '';
      if (!objectKey)
        return reply.status(404).send({ error: 'PDF not available for this version' });

      const storage = request.server.storage;
      if (!storage) return reply.status(503).send({ error: 'Storage not available' });
      const object = await storage.getObject(objectKey);
      if (!object?.Body) return reply.status(404).send({ error: 'PDF object missing' });

      const filename = buildPdfDownloadFilename(
        `${version.document.title}-v${version.versionNumber}`,
        documentId
      );
      reply.header('Content-Type', 'application/pdf');
      reply.header('Content-Disposition', `attachment; filename="${filename}"`);
      reply.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
      return reply.send(object.Body);
    }
  );
};
