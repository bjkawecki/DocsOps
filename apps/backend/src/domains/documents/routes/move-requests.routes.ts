import type { FastifyInstance } from 'fastify';
import {
  requireAuthPreHandler,
  preHandlerWrap,
  getEffectiveUserId,
  type RequestWithUser,
} from '../../auth/middleware.js';
import {
  requireDocumentAccess,
  canRequestDocumentMove,
  canDecideDocumentMove,
  canWithdrawDocumentMove,
} from '../permissions/index.js';
import {
  createMoveRequestBodySchema,
  decideMoveRequestBodySchema,
  documentIdParamSchema,
  moveRequestIdParamSchema,
} from '../schemas/documents.js';
import {
  createMoveRequest,
  acceptMoveRequest,
  rejectMoveRequest,
  withdrawMoveRequest,
} from '../services/lifecycle/documentMoveRequestService.js';
import {
  DocumentBusinessError,
  DocumentNotFoundError,
} from '../services/lifecycle/documentService.js';
import {
  excludeUserIds,
  listUserIdsWhoCanWriteContext,
  listUserIdsWhoCanReadOrWriteDocument,
} from '../../notifications/services/notificationRecipients.js';
import {
  enqueueIncrementalReindexForDocumentSafe,
  enqueueNotificationEvent,
} from '../services/route-support/documentRouteSupport.js';

function registerMoveRequestRoutes(app: FastifyInstance): void {
  app.post(
    '/documents/:documentId/move-requests',
    {
      preHandler: [requireAuthPreHandler, preHandlerWrap(requireDocumentAccess('writeOrPublish'))],
    },
    async (request, reply) => {
      const prisma = request.server.prisma;
      const userId = getEffectiveUserId(request as RequestWithUser);
      const { documentId } = documentIdParamSchema.parse(request.params);
      const body = createMoveRequestBodySchema.parse(request.body);

      if (!(await canRequestDocumentMove(prisma, userId, documentId))) {
        return reply.status(403).send({ error: 'Permission denied to request a document move' });
      }

      try {
        const { request: moveReq } = await createMoveRequest(
          prisma,
          documentId,
          body.targetContextId,
          userId,
          body.note
        );
        try {
          const recipientIds = excludeUserIds(
            await listUserIdsWhoCanWriteContext(prisma, moveReq.toContextId),
            userId
          );
          await enqueueNotificationEvent({
            eventType: 'document-move-requested',
            targetUserIds: recipientIds,
            payload: {
              documentId,
              moveRequestId: moveReq.id,
              fromContextId: moveReq.fromContextId,
              toContextId: moveReq.toContextId,
              contextId: moveReq.toContextId,
              requestedByUserId: userId,
            },
          });
        } catch (error) {
          request.log.warn(
            { error, documentId },
            'Failed to enqueue notification after move request create'
          );
        }
        return reply.status(201).send(moveReq);
      } catch (err) {
        if (err instanceof DocumentNotFoundError) {
          return reply.status(404).send({ error: 'Document not found' });
        }
        if (err instanceof DocumentBusinessError) {
          if (err.message.includes('already has a pending')) {
            return reply.status(409).send({ error: err.message });
          }
          return reply.status(400).send({ error: err.message });
        }
        throw err;
      }
    }
  );

  app.post(
    '/documents/:documentId/move-requests/:requestId/accept',
    { preHandler: requireAuthPreHandler },
    async (request, reply) => {
      const prisma = request.server.prisma;
      const userId = getEffectiveUserId(request as RequestWithUser);
      const { documentId, requestId } = moveRequestIdParamSchema.parse(request.params);
      const body = decideMoveRequestBodySchema.parse(request.body ?? {});

      if (!(await canDecideDocumentMove(prisma, userId, requestId))) {
        return reply.status(403).send({ error: 'Permission denied to accept this move request' });
      }

      try {
        const result = await acceptMoveRequest(
          prisma,
          documentId,
          requestId,
          userId,
          body.decisionNote
        );
        await enqueueIncrementalReindexForDocumentSafe(request.log, {
          documentId,
          contextId: result.toContextId,
          trigger: 'document-updated',
          warnMessage: 'Failed to enqueue reindex job after move request accept',
        });
        try {
          const readerIds = excludeUserIds(
            await listUserIdsWhoCanReadOrWriteDocument(prisma, documentId),
            userId
          );
          const sourceLeadIds = excludeUserIds(
            await listUserIdsWhoCanWriteContext(prisma, result.fromContextId),
            userId
          );
          await enqueueNotificationEvent({
            eventType: 'document-move-accepted',
            targetUserIds: sourceLeadIds,
            payload: {
              documentId,
              moveRequestId: result.request.id,
              fromContextId: result.fromContextId,
              toContextId: result.toContextId,
              contextId: result.toContextId,
              decidedByUserId: userId,
            },
          });
          await enqueueNotificationEvent({
            eventType: 'document-moved',
            targetUserIds: readerIds,
            payload: {
              documentId,
              fromContextId: result.fromContextId,
              toContextId: result.toContextId,
              contextId: result.toContextId,
              movedByUserId: userId,
              moveRequestId: result.request.id,
            },
          });
        } catch (error) {
          request.log.warn(
            { error, documentId },
            'Failed to enqueue notification after move request accept'
          );
        }
        return reply.send({ request: result.request, document: result.document });
      } catch (err) {
        return mapMoveRequestError(err, reply);
      }
    }
  );

  app.post(
    '/documents/:documentId/move-requests/:requestId/reject',
    { preHandler: requireAuthPreHandler },
    async (request, reply) => {
      const prisma = request.server.prisma;
      const userId = getEffectiveUserId(request as RequestWithUser);
      const { documentId, requestId } = moveRequestIdParamSchema.parse(request.params);
      const body = decideMoveRequestBodySchema.parse(request.body ?? {});

      if (!(await canDecideDocumentMove(prisma, userId, requestId))) {
        return reply.status(403).send({ error: 'Permission denied to reject this move request' });
      }

      try {
        const result = await rejectMoveRequest(
          prisma,
          documentId,
          requestId,
          userId,
          body.decisionNote
        );
        try {
          const recipientIds = excludeUserIds(
            await listUserIdsWhoCanWriteContext(prisma, result.request.fromContextId),
            userId
          );
          await enqueueNotificationEvent({
            eventType: 'document-move-rejected',
            targetUserIds: recipientIds,
            payload: {
              documentId,
              moveRequestId: result.request.id,
              fromContextId: result.request.fromContextId,
              toContextId: result.request.toContextId,
              contextId: result.request.fromContextId,
              decidedByUserId: userId,
            },
          });
        } catch (error) {
          request.log.warn(
            { error, documentId },
            'Failed to enqueue notification after move request reject'
          );
        }
        return reply.send(result.request);
      } catch (err) {
        return mapMoveRequestError(err, reply);
      }
    }
  );

  app.post(
    '/documents/:documentId/move-requests/:requestId/withdraw',
    { preHandler: requireAuthPreHandler },
    async (request, reply) => {
      const prisma = request.server.prisma;
      const userId = getEffectiveUserId(request as RequestWithUser);
      const { documentId, requestId } = moveRequestIdParamSchema.parse(request.params);
      const body = decideMoveRequestBodySchema.parse(request.body ?? {});

      if (!(await canWithdrawDocumentMove(prisma, userId, requestId))) {
        return reply.status(403).send({ error: 'Permission denied to withdraw this move request' });
      }

      try {
        const result = await withdrawMoveRequest(
          prisma,
          documentId,
          requestId,
          userId,
          body.decisionNote
        );
        try {
          const recipientIds = excludeUserIds(
            await listUserIdsWhoCanWriteContext(prisma, result.request.toContextId),
            userId
          );
          await enqueueNotificationEvent({
            eventType: 'document-move-withdrawn',
            targetUserIds: recipientIds,
            payload: {
              documentId,
              moveRequestId: result.request.id,
              fromContextId: result.request.fromContextId,
              toContextId: result.request.toContextId,
              contextId: result.request.toContextId,
              decidedByUserId: userId,
            },
          });
        } catch (error) {
          request.log.warn(
            { error, documentId },
            'Failed to enqueue notification after move request withdraw'
          );
        }
        return reply.send(result.request);
      } catch (err) {
        return mapMoveRequestError(err, reply);
      }
    }
  );
}

function mapMoveRequestError(
  err: unknown,
  reply: { status: (code: number) => { send: (body: unknown) => unknown } }
) {
  if (err instanceof DocumentNotFoundError) {
    return reply.status(404).send({ error: 'Document not found' });
  }
  if (err instanceof DocumentBusinessError) {
    if (err.message.includes('not found')) {
      return reply.status(404).send({ error: err.message });
    }
    if (err.message.includes('no longer pending')) {
      return reply.status(400).send({ error: err.message });
    }
    return reply.status(400).send({ error: err.message });
  }
  throw err;
}

export { registerMoveRequestRoutes };
