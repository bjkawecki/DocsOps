import type { PrismaClient } from '../../../../generated/prisma/client.js';
import { getEffectiveUserId, type RequestWithUser } from '../../auth/middleware.js';
import { documentIdParamSchema, documentCommentIdParamSchema } from '../schemas/documents.js';

export function parseDocumentId(params: unknown): string {
  return documentIdParamSchema.parse(params).documentId;
}

/** prisma + userId + documentId für Routen mit `:documentId`. */
export function routePrismaUserDocumentId(request: {
  server: { prisma: PrismaClient };
  params: unknown;
}): { prisma: PrismaClient; userId: string; documentId: string } {
  return {
    prisma: request.server.prisma,
    userId: getEffectiveUserId(request as RequestWithUser),
    documentId: parseDocumentId(request.params),
  };
}

export function routePrismaUserDocumentCommentIds(request: {
  server: { prisma: PrismaClient };
  params: unknown;
}): { prisma: PrismaClient; userId: string; documentId: string; commentId: string } {
  const base = routePrismaUserDocumentId(request);
  const { commentId } = documentCommentIdParamSchema.parse(request.params);
  return { ...base, commentId };
}
