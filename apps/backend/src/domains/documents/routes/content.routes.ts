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
  canWrite,
  canPublishDocument,
  canMoveDocument,
  canModerateDocumentComments,
  DOCUMENT_FOR_PERMISSION_INCLUDE,
} from '../permissions/index.js';
import {
  deleteDocument,
  updateDocumentMetadata,
  updateDocumentTypeKey,
  type DocumentMetadataUpdateResult,
  DocumentNotFoundError,
  DocumentBusinessError,
} from '../services/lifecycle/documentService.js';
import { getPendingMoveRequestForDocument } from '../services/lifecycle/documentMoveRequestService.js';
import { recordDocumentView } from '../services/lifecycle/documentViewService.js';
import {
  createDocument,
  DocumentTemplateNotFoundError,
  DocumentTemplateValidationError,
} from '../services/lifecycle/createDocument.js';
import {
  resolveDocumentTypeKey,
  resolveOwnerChainForContext,
} from '../services/templates/documentTemplateService.js';
import { documentMarkdownFromRow } from '../services/query/documentMarkdownSnapshot.js';
import {
  documentIdParamSchema,
  createDocumentBodySchema,
  updateDocumentBodySchema,
  updateDocumentTypeBodySchema,
} from '../schemas/documents.js';
import {
  excludeUserIds,
  listUserIdsWhoCanReadDocument,
  listUserIdsWhoCanReadOrWriteDocument,
} from '../../notifications/services/notificationRecipients.js';
import {
  enqueueIncrementalReindexForDocumentSafe,
  enqueueNotificationEvent,
  buildDocumentDetailResponse,
  patchTouchesReaderVisibleFields,
  readerVisibleContentChanged,
} from '../services/route-support/documentRouteSupport.js';
import { routePrismaUserDocumentId } from './collaboration-route-helpers.js';
import { listStartHereOptionsForDocument } from '../../organisation/services/startHereService.js';
import { validateContextWriteAccess, validateTagsForContext } from './content-route-helpers.js';
import { registerContentAttachmentRoutes } from './contentAttachments.routes.js';
import { registerContentMoveRoutes } from './contentMove.routes.js';

export const registerContentRoutes = (app: FastifyInstance): void => {
  registerContentAttachmentRoutes(app);

  app.get<{ Params: { documentId: string } }>(
    '/documents/:documentId',
    {
      preHandler: [requireAuthPreHandler, preHandlerWrap(requireDocumentAccess('read'))],
    },
    async (request, reply) => {
      const { prisma, userId, documentId } = routePrismaUserDocumentId(request);
      const doc = await prisma.document.findFirst({
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
      if (!doc) return reply.status(404).send({ error: 'Document not found' });
      const isTrashed = doc.deletedAt != null;
      if (!isTrashed && doc.publishedAt == null) {
        const [writeAllowedForDraft, canPublishDraft] = await Promise.all([
          canWrite(prisma, userId, doc),
          canPublishDocument(prisma, userId, documentId),
        ]);
        if (!writeAllowedForDraft && !canPublishDraft) {
          return reply
            .status(403)
            .send({ error: 'Draft documents are only visible to users with write access' });
        }
      }
      const [
        writeAllowed,
        deleteAllowed,
        canPublish,
        canMove,
        canModerateComments,
        startHereScopes,
        moveRequestFlags,
      ] = await Promise.all([
        isTrashed ? Promise.resolve(false) : canWrite(prisma, userId, doc),
        canDeleteDocument(prisma, userId, documentId),
        isTrashed ? Promise.resolve(false) : canPublishDocument(prisma, userId, documentId),
        isTrashed ? Promise.resolve(false) : canMoveDocument(prisma, userId, documentId),
        isTrashed ? Promise.resolve(false) : canModerateDocumentComments(prisma, userId, doc),
        isTrashed
          ? Promise.resolve([])
          : listStartHereOptionsForDocument(prisma, userId, documentId),
        isTrashed
          ? Promise.resolve({
              canRequestMove: false,
              canAcceptMove: false,
              pendingMoveRequest: null,
            })
          : getPendingMoveRequestForDocument(prisma, userId, documentId),
      ]);
      try {
        await recordDocumentView(prisma, userId, documentId);
      } catch (error) {
        request.log.warn({ error, documentId, userId }, 'Failed to record document view');
      }
      return reply.send(
        buildDocumentDetailResponse({
          doc,
          writeAllowed,
          deleteAllowed,
          canPublish,
          canMove,
          canRequestMove: moveRequestFlags.canRequestMove,
          canAcceptMove: moveRequestFlags.canAcceptMove,
          pendingMoveRequest: moveRequestFlags.pendingMoveRequest,
          canModerateComments,
          startHereScopes,
        })
      );
    }
  );
  app.post('/documents', { preHandler: requireAuthPreHandler }, async (request, reply) => {
    const prisma = request.server.prisma;
    const userId = getEffectiveUserId(request as RequestWithUser);
    const body = createDocumentBodySchema.parse(request.body);

    if (body.contextId == null) {
      try {
        const created = await createDocument(prisma, {
          title: body.title,
          contextId: null,
          description: body.description ?? null,
          typeId: body.typeId,
          templateId: body.templateId,
          createdById: userId,
        });
        await enqueueIncrementalReindexForDocumentSafe(request.log, {
          documentId: created.id,
          contextId: null,
          trigger: 'document-created',
          warnMessage: 'Failed to enqueue reindex job after document creation',
        });
        return reply.status(201).send(created);
      } catch (err) {
        if (
          err instanceof DocumentTemplateNotFoundError ||
          err instanceof DocumentTemplateValidationError
        ) {
          return reply.status(400).send({ error: err.message });
        }
        throw err;
      }
    }

    if (
      !(await validateContextWriteAccess(
        prisma,
        userId,
        body.contextId,
        reply,
        'Permission denied to create document in this context'
      ))
    ) {
      return;
    }
    if (!(await validateTagsForContext(prisma, body.contextId, body.tagIds, reply))) {
      return;
    }

    try {
      const created = await createDocument(prisma, {
        title: body.title,
        contextId: body.contextId,
        tagIds: body.tagIds,
        description: body.description ?? null,
        typeId: body.typeId,
        templateId: body.templateId,
        createdById: userId,
      });
      await enqueueIncrementalReindexForDocumentSafe(request.log, {
        documentId: created.id,
        contextId: created.contextId,
        trigger: 'document-created',
        warnMessage: 'Failed to enqueue reindex job after document creation',
      });
      return reply.status(201).send(created);
    } catch (err) {
      if (
        err instanceof DocumentTemplateNotFoundError ||
        err instanceof DocumentTemplateValidationError
      ) {
        return reply.status(400).send({ error: err.message });
      }
      throw err;
    }
  });

  app.patch<{ Params: { documentId: string } }>(
    '/documents/:documentId/document-type',
    {
      preHandler: [requireAuthPreHandler, preHandlerWrap(requireDocumentAccess('write'))],
    },
    async (request, reply) => {
      const prisma = request.server.prisma;
      const { documentId } = documentIdParamSchema.parse(request.params);
      const body = updateDocumentTypeBodySchema.parse(request.body);

      const doc = await prisma.document.findFirst({
        where: { id: documentId, deletedAt: null },
        select: { contextId: true },
      });
      if (!doc) return reply.status(404).send({ error: 'Document not found' });

      try {
        const chain =
          doc.contextId != null ? await resolveOwnerChainForContext(prisma, doc.contextId) : null;
        const documentTypeKey = await resolveDocumentTypeKey(prisma, body.typeId, chain);
        const updated = await updateDocumentTypeKey(prisma, documentId, documentTypeKey);
        return reply.send(updated);
      } catch (err) {
        if (
          err instanceof DocumentTemplateNotFoundError ||
          err instanceof DocumentTemplateValidationError
        ) {
          return reply.status(400).send({ error: err.message });
        }
        if (err instanceof DocumentNotFoundError) {
          return reply.status(404).send({ error: 'Document not found' });
        }
        throw err;
      }
    }
  );

  app.patch(
    '/documents/:documentId',
    {
      preHandler: [requireAuthPreHandler, preHandlerWrap(requireDocumentAccess('writeOrPublish'))],
    },
    async (request, reply) => {
      const prisma = request.server.prisma;
      const userId = getEffectiveUserId(request as RequestWithUser);
      const { documentId } = documentIdParamSchema.parse(request.params);
      const body = updateDocumentBodySchema.parse(request.body);

      const beforeUpdate = await prisma.document.findUnique({
        where: { id: documentId },
        select: {
          publishedAt: true,
          title: true,
          description: true,
          contextId: true,
          documentTags: { select: { tagId: true } },
        },
      });
      if (!beforeUpdate) return reply.status(404).send({ error: 'Document not found' });

      if (
        body.contextId !== undefined &&
        body.contextId !== null &&
        beforeUpdate.contextId != null &&
        body.contextId !== beforeUpdate.contextId
      ) {
        return reply.status(400).send({
          error:
            'Changing context on an assigned document requires POST /documents/:documentId/move',
        });
      }

      if (body.contextId !== undefined && body.contextId !== null) {
        if (
          !(await validateContextWriteAccess(
            prisma,
            userId,
            body.contextId,
            reply,
            'Permission denied to assign document to this context'
          ))
        ) {
          return;
        }
      }

      if (body.tagIds !== undefined && body.tagIds.length > 0) {
        if (beforeUpdate.contextId == null) {
          return reply
            .status(400)
            .send({ error: 'Document has no context; tags require a context' });
        }
        if (!(await validateTagsForContext(prisma, beforeUpdate.contextId, body.tagIds, reply))) {
          return;
        }
      }

      const shouldConsiderReaderNotification =
        beforeUpdate.publishedAt != null && patchTouchesReaderVisibleFields(body);

      try {
        const doc: DocumentMetadataUpdateResult = await updateDocumentMetadata(prisma, documentId, {
          title: body.title,
          contextId: body.contextId,
          description: body.description,
          tagIds: body.tagIds,
        });
        await enqueueIncrementalReindexForDocumentSafe(request.log, {
          documentId,
          contextId: doc.contextId,
          trigger: 'document-updated',
          warnMessage: 'Failed to enqueue reindex job after document update',
        });
        try {
          if (
            shouldConsiderReaderNotification &&
            readerVisibleContentChanged({ before: beforeUpdate, body, after: doc })
          ) {
            const readerIds = excludeUserIds(
              await listUserIdsWhoCanReadDocument(prisma, documentId),
              userId
            );
            await enqueueNotificationEvent({
              eventType: 'document-updated',
              targetUserIds: readerIds,
              payload: { documentId, contextId: doc.contextId, updatedByUserId: userId },
            });
          }
        } catch (error) {
          request.log.warn(
            { error, documentId },
            'Failed to enqueue notification job after document update'
          );
        }
        const mdRow = await prisma.document.findUnique({
          where: { id: documentId },
          select: {
            publishedAt: true,
            draftBlocks: true,
            currentPublishedVersion: { select: { blocks: true } },
          },
        });
        return reply.send({
          ...doc,
          content: mdRow
            ? documentMarkdownFromRow({
                publishedAt: mdRow.publishedAt,
                draftBlocks: mdRow.draftBlocks,
                currentPublishedVersion: mdRow.currentPublishedVersion,
              })
            : '',
          createdByName: doc.createdBy?.name ?? null,
          writers: { users: [], teams: [], departments: [] },
        });
      } catch (err) {
        if (err instanceof DocumentNotFoundError)
          return reply.status(404).send({ error: 'Document not found' });
        if (err instanceof DocumentBusinessError)
          return reply.status(400).send({ error: err.message });
        throw err;
      }
    }
  );

  registerContentMoveRoutes(app);

  app.delete(
    '/documents/:documentId',
    { preHandler: requireAuthPreHandler },
    async (request, reply) => {
      const prisma = request.server.prisma;
      const userId = getEffectiveUserId(request as RequestWithUser);
      const { documentId } = documentIdParamSchema.parse(request.params);
      const allowed = await canDeleteDocument(prisma, userId, documentId);
      if (!allowed) {
        return reply.status(403).send({ error: 'Permission denied to delete this document' });
      }
      let notifyTargets: string[] = [];
      try {
        notifyTargets = excludeUserIds(
          await listUserIdsWhoCanReadOrWriteDocument(prisma, documentId),
          userId
        );
      } catch (error) {
        request.log.warn(
          { error, documentId },
          'Failed to resolve notification recipients before document delete'
        );
      }
      await deleteDocument(prisma, documentId, userId);
      await enqueueIncrementalReindexForDocumentSafe(request.log, {
        documentId,
        trigger: 'document-deleted',
        warnMessage: 'Failed to enqueue reindex job after document delete',
      });
      try {
        await enqueueNotificationEvent({
          eventType: 'document-deleted',
          targetUserIds: notifyTargets,
          payload: { documentId, deletedByUserId: userId },
        });
      } catch (error) {
        request.log.warn(
          { error, documentId },
          'Failed to enqueue notification job after document delete'
        );
      }
      return reply.status(204).send();
    }
  );
};
