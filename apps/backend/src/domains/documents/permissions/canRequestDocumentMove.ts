import type { PrismaClient } from '../../../../generated/prisma/client.js';
import { canWriteContext } from '../../organisation/permissions/contextPermissions.js';

/**
 * Whether the user may create a cross-owner move request from the document's current context.
 * Gate: canWriteContext on source (scope lead / personal owner / admin).
 */
export async function canRequestDocumentMove(
  prisma: PrismaClient,
  userId: string,
  documentId: string
): Promise<boolean> {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: { contextId: true, deletedAt: true },
  });
  if (!doc || doc.deletedAt != null) return false;
  if (doc.contextId == null) return false;
  return canWriteContext(prisma, userId, doc.contextId);
}
