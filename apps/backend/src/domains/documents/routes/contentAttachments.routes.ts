import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import {
  requireAuthPreHandler,
  preHandlerWrap,
  getEffectiveUserId,
  type RequestWithUser,
} from '../../auth/middleware.js';
import { requireDocumentAccess } from '../permissions/index.js';
import { documentIdParamSchema } from '../schemas/documents.js';
import { requireStorageAndDocumentAttachment } from './document-attachment-route-helpers.js';
import { isDemoMode } from '../../../config/runtimeMode.js';

const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const DEMO_MAX_ATTACHMENT_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

function maxAttachmentSizeBytes(): number {
  return isDemoMode() ? DEMO_MAX_ATTACHMENT_SIZE_BYTES : MAX_ATTACHMENT_SIZE_BYTES;
}

export function registerContentAttachmentRoutes(app: FastifyInstance): void {
  const maxBytes = maxAttachmentSizeBytes();
  app.post<{
    Params: { documentId: string };
    Body: Buffer;
  }>(
    '/documents/:documentId/attachments',
    {
      preHandler: [requireAuthPreHandler, preHandlerWrap(requireDocumentAccess('write'))],
      bodyLimit: maxBytes,
    },
    async (request, reply) => {
      const storage = request.server.storage;
      if (!storage) return reply.status(503).send({ error: 'Storage not available' });
      const prisma = request.server.prisma;
      const userId = getEffectiveUserId(request as RequestWithUser);
      const { documentId } = documentIdParamSchema.parse(request.params);
      const filename = (request.headers['x-filename'] as string)?.trim();
      if (!filename) return reply.status(400).send({ error: 'X-Filename header required' });
      const body = request.body;
      if (!Buffer.isBuffer(body) || body.length === 0) {
        return reply.status(400).send({ error: 'Binary body required' });
      }
      if (body.length > maxBytes) {
        return reply.status(413).send({ error: 'File too large' });
      }
      const contentType = (request.headers['content-type'] as string) ?? undefined;
      const ext = filename.includes('.') ? filename.split('.').pop()!.toLowerCase() : 'bin';
      const objectKey = `attachments/${documentId}/${randomUUID()}.${ext}`;
      await storage.uploadStream(objectKey, body, contentType);
      const attachment = await prisma.documentAttachment.create({
        data: {
          documentId,
          objectKey,
          filename,
          contentType: contentType || null,
          sizeBytes: body.length,

          uploadedById: userId,
        },
      });
      return reply.status(201).send({
        id: attachment.id,
        documentId: attachment.documentId,
        filename: attachment.filename,
        contentType: attachment.contentType,
        sizeBytes: attachment.sizeBytes,
        createdAt: attachment.createdAt,
      });
    }
  );
  app.delete<{ Params: { documentId: string; attachmentId: string } }>(
    '/documents/:documentId/attachments/:attachmentId',
    {
      preHandler: [requireAuthPreHandler, preHandlerWrap(requireDocumentAccess('write'))],
    },
    async (request, reply) => {
      const loaded = await requireStorageAndDocumentAttachment(request, reply);
      if (!loaded) return;
      const { storage, prisma, attachmentId, attachment } = loaded;
      await storage.deleteObject(attachment.objectKey);
      await prisma.documentAttachment.delete({ where: { id: attachmentId } });
      return reply.status(204).send();
    }
  );
}
