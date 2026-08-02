import type { FastifyInstance } from 'fastify';
import { treeifyError } from 'zod';
import type { PrismaClient } from '../../../../generated/prisma/client.js';
import { requireAuthPreHandler, preHandlerWrap } from '../../auth/middleware.js';
import { requireDocumentAccess, canModerateDocumentComments } from '../permissions/index.js';
import { loadDocument } from '../permissions/canRead.js';
import type { DocumentForPermission } from '../permissions/documentLoad.js';
import {
  createDocumentComment,
  deleteDocumentComment,
  listDocumentComments,
  updateDocumentComment,
} from '../services/collaboration/documentCommentService.js';
import {
  loadDocumentCommentAnchorSnapshot,
  mapCreateCommentError,
  mapDeleteCommentError,
  mapUpdateCommentError,
  serializeCommentRow,
  serializeCommentTree,
} from '../services/route-support/documentCommentRouteSupport.js';
import {
  paginationQuerySchema,
  createDocumentCommentBodySchema,
  patchDocumentCommentBodySchema,
} from '../schemas/documents.js';
import {
  listCommentNotificationRecipientIds,
  listDocumentCommentMentionCandidates,
  validateCommentMentionsForDocument,
} from '../../notifications/services/commentNotificationRecipients.js';
import { enqueueNotificationEvent } from '../../notifications/services/notificationEnqueueService.js';
import {
  routePrismaUserDocumentCommentIds,
  routePrismaUserDocumentId,
} from './collaboration-route-helpers.js';

async function loadDocumentWithCommentModeration(
  prisma: PrismaClient,
  userId: string,
  documentId: string
): Promise<{ doc: DocumentForPermission; canModerate: boolean } | null> {
  const doc = await loadDocument(prisma, documentId);
  if (!doc) return null;
  const canModerate = await canModerateDocumentComments(prisma, userId, doc);
  return { doc, canModerate };
}

export const registerCommentRoutes = (app: FastifyInstance): void => {
  /** GET users who can be @mentioned on this document (canRead). */
  app.get<{ Params: { documentId: string } }>(
    '/documents/:documentId/comments/mention-candidates',
    {
      preHandler: [requireAuthPreHandler, preHandlerWrap(requireDocumentAccess('read'))],
    },
    async (request, reply) => {
      const { prisma, documentId } = routePrismaUserDocumentId(request);
      const items = await listDocumentCommentMentionCandidates(prisma, documentId);
      return reply.send({ items });
    }
  );

  /** GET Document comments (canRead). Top-level only (parentId null); pagination. */
  app.get<{ Params: { documentId: string }; Querystring: Record<string, string | undefined> }>(
    '/documents/:documentId/comments',
    {
      preHandler: [requireAuthPreHandler, preHandlerWrap(requireDocumentAccess('read'))],
    },
    async (request, reply) => {
      const { prisma, userId, documentId } = routePrismaUserDocumentId(request);
      const query = paginationQuerySchema.parse(request.query ?? {});
      const loaded = await loadDocumentWithCommentModeration(prisma, userId, documentId);
      if (!loaded) return reply.status(404).send({ error: 'Document not found' });
      const { canModerate } = loaded;
      const { items, total } = await listDocumentComments(prisma, documentId, {
        limit: query.limit,
        offset: query.offset,
      });
      return reply.send({
        items: serializeCommentTree(items, { userId, canModerate }),
        total,
        limit: query.limit,
        offset: query.offset,
      });
    }
  );

  /** POST Document comment (canRead). */
  app.post<{ Params: { documentId: string } }>(
    '/documents/:documentId/comments',
    {
      preHandler: [requireAuthPreHandler, preHandlerWrap(requireDocumentAccess('read'))],
    },
    async (request, reply) => {
      const { prisma, userId, documentId } = routePrismaUserDocumentId(request);
      const parsed = createDocumentCommentBodySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Invalid body',
          details: treeifyError(parsed.error),
        });
      }
      const docSnapshot = await loadDocumentCommentAnchorSnapshot(prisma, documentId);
      if (!docSnapshot) return reply.status(404).send({ error: 'Document not found' });
      const mentionCheck = await validateCommentMentionsForDocument(
        prisma,
        documentId,
        parsed.data.text
      );
      if (!mentionCheck.ok) {
        return reply.status(400).send({
          error: 'One or more mentioned users cannot read this document.',
        });
      }
      const created = await createDocumentComment(prisma, {
        documentId,
        authorId: userId,
        text: parsed.data.text,
        parentId: parsed.data.parentId,
        anchorHeadingId: parsed.data.anchorHeadingId,
        documentBlocks: docSnapshot.activeBlocks,
      });
      if (!created.ok) {
        const mapped = mapCreateCommentError(created);
        return reply.status(mapped.status).send({ error: mapped.error });
      }
      const row = created.comment;
      try {
        const { recipientIds, kind } = await listCommentNotificationRecipientIds({
          prisma,
          documentId,
          authorUserId: userId,
          parentId: row.parentId,
          text: row.text,
        });
        if (recipientIds.length > 0) {
          await enqueueNotificationEvent({
            eventType: 'document-comment-created',
            targetUserIds: recipientIds,
            payload: {
              documentId,
              commentId: row.id,
              parentId: row.parentId,
              authorUserId: userId,
              documentTitle: docSnapshot.title,
              commentPreview: row.text.slice(0, 200),
              kind,
            },
          });
        }
      } catch (error) {
        request.log.warn(
          { error, documentId },
          'Failed to enqueue notification job after document comment'
        );
      }
      const serialized = serializeCommentRow(row, { userId, canModerate: true });
      return reply
        .status(201)
        .send({ ...serialized, replies: row.parentId == null ? [] : undefined });
    }
  );

  /** PATCH Document comment – author only (canRead). */
  app.patch<{ Params: { documentId: string; commentId: string } }>(
    '/documents/:documentId/comments/:commentId',
    {
      preHandler: [requireAuthPreHandler, preHandlerWrap(requireDocumentAccess('read'))],
    },
    async (request, reply) => {
      const { prisma, userId, documentId, commentId } = routePrismaUserDocumentCommentIds(request);
      const body = patchDocumentCommentBodySchema.parse(request.body);
      const docSnapshot = await loadDocumentCommentAnchorSnapshot(prisma, documentId);
      if (!docSnapshot) return reply.status(404).send({ error: 'Document not found' });
      const result = await updateDocumentComment(prisma, {
        documentId,
        commentId,
        userId,
        text: body.text,
        anchorHeadingId: body.anchorHeadingId,
        documentBlocks: docSnapshot.activeBlocks,
      });
      if (!result.ok) {
        const mapped = mapUpdateCommentError(result);
        return reply.status(mapped.status).send({ error: mapped.error });
      }
      const doc = await loadDocument(prisma, documentId);
      const canModerate = doc ? await canModerateDocumentComments(prisma, userId, doc) : false;
      const c = result.comment;
      return reply.send(serializeCommentRow(c, { userId, canModerate }));
    }
  );

  /** DELETE Document comment – author or moderator (canRead + moderation rule). */
  app.delete<{ Params: { documentId: string; commentId: string } }>(
    '/documents/:documentId/comments/:commentId',
    {
      preHandler: [requireAuthPreHandler, preHandlerWrap(requireDocumentAccess('read'))],
    },
    async (request, reply) => {
      const { prisma, userId, documentId, commentId } = routePrismaUserDocumentCommentIds(request);
      const loaded = await loadDocumentWithCommentModeration(prisma, userId, documentId);
      if (!loaded) return reply.status(404).send({ error: 'Document not found' });
      const { canModerate } = loaded;
      const result = await deleteDocumentComment(prisma, {
        documentId,
        commentId,
        userId,
        canModerate,
      });
      if (!result.ok) {
        const mapped = mapDeleteCommentError(result);
        return reply.status(mapped.status).send({ error: mapped.error });
      }
      return reply.status(204).send();
    }
  );
};
