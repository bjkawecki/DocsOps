import type { FastifyInstance } from 'fastify';
import {
  requireAuthPreHandler,
  preHandlerWrap,
  getEffectiveUserId,
  type RequestWithUser,
} from '../../auth/middleware.js';
import { requireDocumentAccess } from '../permissions/index.js';
import { getContextOwnerId } from '../../organisation/permissions/contextPermissions.js';
import {
  DocumentNotFoundError,
  DocumentBusinessError,
} from '../services/lifecycle/documentService.js';
import { moveDocument } from '../services/lifecycle/documentMoveService.js';
import { documentIdParamSchema, moveDocumentBodySchema } from '../schemas/documents.js';
import {
  excludeUserIds,
  listUserIdsWhoCanReadOrWriteDocument,
} from '../../notifications/services/notificationRecipients.js';
import {
  enqueueIncrementalReindexForDocumentSafe,
  enqueueNotificationEvent,
} from '../services/route-support/documentRouteSupport.js';
import { validateContextWriteAccess } from './content-route-helpers.js';

export function registerContentMoveRoutes(app: FastifyInstance): void {
  app.post(
    '/documents/:documentId/move',
    {
      preHandler: [requireAuthPreHandler, preHandlerWrap(requireDocumentAccess('writeOrPublish'))],
    },
    async (request, reply) => {
      const prisma = request.server.prisma;
      const userId = getEffectiveUserId(request as RequestWithUser);
      const { documentId } = documentIdParamSchema.parse(request.params);
      const body = moveDocumentBodySchema.parse(request.body);

      const sourceDoc = await prisma.document.findUnique({
        where: { id: documentId },
        select: { contextId: true, deletedAt: true },
      });
      if (!sourceDoc || sourceDoc.deletedAt != null) {
        return reply.status(404).send({ error: 'Document not found' });
      }
      if (sourceDoc.contextId == null) {
        return reply.status(400).send({
          error: 'Document has no context; use PATCH to assign a context first',
        });
      }

      if (
        !(await validateContextWriteAccess(
          prisma,
          userId,
          sourceDoc.contextId,
          reply,
          'Permission denied to move document from this context'
        ))
      ) {
        return;
      }

      const [sourceOwnerId, targetOwnerId] = await Promise.all([
        getContextOwnerId(prisma, sourceDoc.contextId),
        getContextOwnerId(prisma, body.targetContextId),
      ]);
      if (sourceOwnerId == null || targetOwnerId == null) {
        return reply.status(400).send({ error: 'Context has no owner' });
      }
      if (sourceOwnerId !== targetOwnerId) {
        return reply.status(409).send({
          error:
            'Cross-owner move requires a move request; use POST /documents/:documentId/move-requests',
        });
      }

      if (
        !(await validateContextWriteAccess(
          prisma,
          userId,
          body.targetContextId,
          reply,
          'Permission denied to move document to this context'
        ))
      ) {
        return;
      }

      try {
        const result = await moveDocument(prisma, documentId, body.targetContextId);
        await enqueueIncrementalReindexForDocumentSafe(request.log, {
          documentId,
          contextId: result.toContextId,
          trigger: 'document-updated',
          warnMessage: 'Failed to enqueue reindex job after document move',
        });
        try {
          const recipientIds = excludeUserIds(
            await listUserIdsWhoCanReadOrWriteDocument(prisma, documentId),
            userId
          );
          await enqueueNotificationEvent({
            eventType: 'document-moved',
            targetUserIds: recipientIds,
            payload: {
              documentId,
              fromContextId: result.fromContextId,
              toContextId: result.toContextId,
              contextId: result.toContextId,
              movedByUserId: userId,
            },
          });
        } catch (error) {
          request.log.warn(
            { error, documentId },
            'Failed to enqueue notification job after document move'
          );
        }
        request.log.info(
          {
            documentId,
            fromContextId: result.fromContextId,
            toContextId: result.toContextId,
            movedByUserId: userId,
          },
          'Document moved between contexts'
        );
        return reply.send(result.document);
      } catch (err) {
        if (err instanceof DocumentNotFoundError) {
          return reply.status(404).send({ error: 'Document not found' });
        }
        if (err instanceof DocumentBusinessError) {
          const message = err.message;
          if (message.includes('Cross-owner')) {
            return reply.status(409).send({ error: message });
          }
          return reply.status(400).send({ error: message });
        }
        throw err;
      }
    }
  );
}
