import type { FastifyInstance } from 'fastify';
import {
  requireAuthPreHandler,
  preHandlerWrap,
  getEffectiveUserId,
  type RequestWithUser,
} from '../../auth/middleware.js';
import {
  requireDocumentAccess,
  canDeleteDocument,
  canPublishDocument,
  canMoveDocument,
  canWrite,
  canModerateDocumentComments,
  DOCUMENT_FOR_PERMISSION_INCLUDE,
} from '../permissions/index.js';
import { canSeeDocumentInTrash } from '../permissions/canRead.js';
import {
  publishDocument,
  archiveDocument,
  restoreDocument,
  DocumentNotFoundError,
  DocumentNotPublishableError,
  DocumentDeletedError,
  DocumentNotInTrashError,
} from '../services/lifecycle/documentService.js';
import { blockDocumentV0ToMarkdown } from '../services/blocks/blocksToMarkdown.js';
import { parseBlockDocumentFromDb } from '../services/blocks/documentBlocksBackfill.js';
import {
  documentIdParamSchema,
  pdfExportLocaleBodySchema,
  versionIdParamSchema,
} from '../schemas/documents.js';
import { resolvePdfExportLocale } from '../../../infrastructure/pdf/pdfExportMeta.js';
import { routePrismaUserDocumentId } from './collaboration-route-helpers.js';
import { enqueueJob } from '../../../infrastructure/jobs/client.js';
import {
  excludeUserIds,
  listUserIdsWhoCanReadDocument,
} from '../../notifications/services/notificationRecipients.js';
import { notifyDocumentPublishedCollaborationChanged } from '../services/collaboration/documentCollaborationLiveNotify.js';
import {
  buildDocumentDetailResponse,
  enqueueIncrementalReindexForDocumentSafe,
  enqueueNotificationEvent,
} from '../services/route-support/documentRouteSupport.js';
import { requireStorageAndDocumentAttachment } from './document-attachment-route-helpers.js';
import { registerPublicationPdfRoutes } from './publicationPdf.routes.js';

export const registerPublicationRoutes = (app: FastifyInstance): void => {
  registerPublicationPdfRoutes(app);

  /** POST Publish – Lead-Draft als Version veröffentlichen (v1 oder nächste Version). */
  app.post<{ Params: { documentId: string } }>(
    '/documents/:documentId/publish',
    {
      preHandler: [requireAuthPreHandler, preHandlerWrap(requireDocumentAccess('read'))],
    },
    async (request, reply) => {
      const { prisma, userId, documentId } = routePrismaUserDocumentId(request);

      const allowed = await canPublishDocument(prisma, userId, documentId);
      if (!allowed) {
        return reply.status(403).send({ error: 'Permission denied to publish this document' });
      }

      try {
        const result = await publishDocument(prisma, documentId, userId);
        try {
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
          await enqueueJob('documents.export.pdf', {
            documentId,
            versionId: result.currentPublishedVersionId,
            requestedByUserId: userId,
            locale,
          });
        } catch (error) {
          request.log.warn(
            { error, documentId, versionId: result.currentPublishedVersionId },
            'Queue unavailable while enqueueing PDF export after publish'
          );
        }
        const doc = await prisma.document.findUnique({
          where: { id: documentId },
          include: {
            ...DOCUMENT_FOR_PERMISSION_INCLUDE,
            documentTags: { include: { tag: { select: { id: true, name: true } } } },
            createdBy: { select: { name: true } },
            currentPublishedVersion: {
              select: { versionNumber: true, blocks: true, blocksSchemaVersion: true },
            },
            grantUser: { include: { user: { select: { name: true } } } },
            grantTeam: { include: { team: { select: { name: true } } } },
            grantDepartment: { include: { department: { select: { name: true } } } },
          },
        });
        if (!doc) {
          return reply.status(500).send({ error: 'Publish succeeded but document not found' });
        }
        await enqueueIncrementalReindexForDocumentSafe(request.log, {
          documentId,
          contextId: doc.contextId,
          trigger: 'document-updated',
          warnMessage: 'Failed to enqueue reindex job after document publish',
        });
        try {
          const readerIds = excludeUserIds(
            await listUserIdsWhoCanReadDocument(prisma, documentId),
            userId
          );
          await enqueueNotificationEvent({
            eventType: result.isRepublish ? 'document-updated' : 'document-published',
            targetUserIds: readerIds,
            payload: {
              documentId,
              contextId: doc.contextId,
              ...(result.isRepublish ? { updatedByUserId: userId } : { publishedByUserId: userId }),
            },
          });
        } catch (error) {
          request.log.warn(
            { error, documentId },
            'Failed to enqueue notification job after document publish'
          );
        }
        notifyDocumentPublishedCollaborationChanged(
          prisma,
          documentId,
          doc.currentPublishedVersion?.versionNumber ?? 1
        );
        const [writeAllowed, deleteAllowed, canPublish, canMove, canModerateComments] =
          await Promise.all([
            canWrite(prisma, userId, doc),
            canDeleteDocument(prisma, userId, documentId),
            canPublishDocument(prisma, userId, documentId),
            canMoveDocument(prisma, userId, documentId),
            canModerateDocumentComments(prisma, userId, doc),
          ]);
        return reply.send(
          buildDocumentDetailResponse({
            doc,
            writeAllowed,
            deleteAllowed,
            canPublish,
            canMove,
            canModerateComments,
          })
        );
      } catch (err) {
        if (err instanceof DocumentNotFoundError) {
          return reply.status(404).send({ error: 'Document not found' });
        }
        if (err instanceof DocumentNotPublishableError) {
          return reply.status(400).send({ error: err.message });
        }
        throw err;
      }
    }
  );

  /** POST Archive – Dokument archivieren (archivedAt setzen). requireDocumentAccess('write'). */
  app.post(
    '/documents/:documentId/archive',
    { preHandler: [requireAuthPreHandler, preHandlerWrap(requireDocumentAccess('write'))] },
    async (request, reply) => {
      const prisma = request.server.prisma;
      const { documentId } = documentIdParamSchema.parse(request.params);
      try {
        await archiveDocument(prisma, documentId);
        await enqueueIncrementalReindexForDocumentSafe(request.log, {
          documentId,
          trigger: 'document-updated',
          warnMessage: 'Failed to enqueue reindex job after document archive',
        });
        try {
          const actorId = getEffectiveUserId(request as RequestWithUser);
          const readerIds = excludeUserIds(
            await listUserIdsWhoCanReadDocument(prisma, documentId),
            actorId
          );
          await enqueueNotificationEvent({
            eventType: 'document-archived',
            targetUserIds: readerIds,
            payload: { documentId, archivedByUserId: actorId },
          });
        } catch (error) {
          request.log.warn(
            { error, documentId },
            'Failed to enqueue notification job after document archive'
          );
        }
        return reply.status(204).send();
      } catch (err) {
        if (err instanceof DocumentNotFoundError) {
          return reply.status(404).send({ error: 'Document not found' });
        }
        if (err instanceof DocumentDeletedError) {
          return reply.status(400).send({ error: 'Document is deleted' });
        }
        throw err;
      }
    }
  );

  /** GET Versionsliste – Leserecht (veröffentlichte Snapshots; kein Draft). */
  app.get<{ Params: { documentId: string } }>(
    '/documents/:documentId/versions',
    {
      preHandler: [requireAuthPreHandler, preHandlerWrap(requireDocumentAccess('read'))],
    },
    async (request, reply) => {
      const prisma = request.server.prisma;
      const { documentId } = documentIdParamSchema.parse(request.params);
      const doc = await prisma.document.findUnique({
        where: { id: documentId },
        select: { id: true },
      });
      if (!doc) return reply.status(404).send({ error: 'Document not found' });

      const versions = await prisma.documentVersion.findMany({
        where: { documentId },
        orderBy: { versionNumber: 'desc' },
        select: {
          id: true,
          versionNumber: true,
          createdAt: true,
          createdById: true,
          createdBy: { select: { name: true } },
          pdfObjectKey: true,
          pdfResponsibleLabel: true,
        },
      });
      const items = versions.map((v) => ({
        id: v.id,
        versionNumber: v.versionNumber,
        createdAt: v.createdAt,
        createdById: v.createdById ?? null,
        createdByName: v.createdBy?.name ?? null,
        pdfReady: Boolean(v.pdfObjectKey),
        pdfResponsibleLabel: v.pdfResponsibleLabel ?? null,
      }));
      return reply.send({ items });
    }
  );

  /** GET Einzelversion – Leserecht (veröffentlichter Snapshot; kein Draft). */
  app.get<{ Params: { documentId: string; versionId: string } }>(
    '/documents/:documentId/versions/:versionId',
    {
      preHandler: [requireAuthPreHandler, preHandlerWrap(requireDocumentAccess('read'))],
    },
    async (request, reply) => {
      const prisma = request.server.prisma;
      const { documentId, versionId } = versionIdParamSchema.parse(request.params);

      const version = await prisma.documentVersion.findFirst({
        where: { id: versionId, documentId },
        select: {
          id: true,
          documentId: true,
          blocks: true,
          blocksSchemaVersion: true,
          versionNumber: true,
          createdAt: true,
          createdById: true,
          createdBy: { select: { name: true } },
        },
      });
      if (!version) return reply.status(404).send({ error: 'Version not found' });

      const versionBlocks = parseBlockDocumentFromDb(version.blocks);
      return reply.send({
        id: version.id,
        documentId: version.documentId,
        content: versionBlocks ? blockDocumentV0ToMarkdown(versionBlocks) : '',
        blocks: versionBlocks,
        blocksSchemaVersion: version.blocksSchemaVersion ?? null,
        versionNumber: version.versionNumber,
        createdAt: version.createdAt,
        createdById: version.createdById ?? null,
        createdByName: version.createdBy?.name ?? null,
      });
    }
  );

  /** POST Dokument aus Papierkorb wiederherstellen. Wenn Kontext trashed: abkoppeln (contextId = null) als Draft; sonst nur deletedAt = null. */
  app.post(
    '/documents/:documentId/restore',
    { preHandler: requireAuthPreHandler },
    async (request, reply) => {
      const prisma = request.server.prisma;
      const userId = getEffectiveUserId(request as RequestWithUser);
      const { documentId } = documentIdParamSchema.parse(request.params);
      const doc = await prisma.document.findUnique({
        where: { id: documentId },
        include: DOCUMENT_FOR_PERMISSION_INCLUDE,
      });
      if (!doc) return reply.status(404).send({ error: 'Document not found' });
      if (doc.deletedAt == null) {
        return reply.status(400).send({ error: 'Not in trash' });
      }
      const allowed =
        (await canDeleteDocument(prisma, userId, documentId)) ||
        (await canSeeDocumentInTrash(prisma, userId, doc));
      if (!allowed) {
        return reply.status(403).send({ error: 'Permission denied to restore this document' });
      }
      try {
        await restoreDocument(prisma, documentId);
        await enqueueIncrementalReindexForDocumentSafe(request.log, {
          documentId,
          trigger: 'document-updated',
          warnMessage: 'Failed to enqueue reindex job after document restore',
        });
        try {
          const readerIds = excludeUserIds(
            await listUserIdsWhoCanReadDocument(prisma, documentId),
            userId
          );
          await enqueueNotificationEvent({
            eventType: 'document-restored',
            targetUserIds: readerIds,
            payload: { documentId, restoredByUserId: userId },
          });
        } catch (error) {
          request.log.warn(
            { error, documentId },
            'Failed to enqueue notification job after document restore'
          );
        }
        return reply.status(204).send();
      } catch (err) {
        if (err instanceof DocumentNotFoundError)
          return reply.status(404).send({ error: 'Document not found' });
        if (err instanceof DocumentNotInTrashError)
          return reply.status(400).send({ error: 'Not in trash' });
        throw err;
      }
    }
  );

  /** GET Attachment file: proxy stream from object storage. */
  app.get<{ Params: { documentId: string; attachmentId: string } }>(
    '/documents/:documentId/attachments/:attachmentId',
    {
      preHandler: [requireAuthPreHandler, preHandlerWrap(requireDocumentAccess('read'))],
    },
    async (request, reply) => {
      const loaded = await requireStorageAndDocumentAttachment(request, reply);
      if (!loaded) return;
      const { storage, attachment } = loaded;
      const object = await storage.getObject(attachment.objectKey);
      if (!object) {
        return reply.status(404).send({ error: 'Attachment object not found in storage' });
      }
      const contentType =
        object.ContentType ?? attachment.contentType ?? 'application/octet-stream';
      const safeFilename = attachment.filename.replace(/"/g, '');
      const isImage = contentType.toLowerCase().startsWith('image/');
      reply.header('Content-Type', contentType);
      reply.header(
        'Content-Disposition',
        `${isImage ? 'inline' : 'attachment'}; filename="${safeFilename}"`
      );
      reply.header('Cache-Control', isImage ? 'private, max-age=60' : 'private, no-store');
      return reply.send(object.Body);
    }
  );
};
