import type { PrismaClient } from '../../../../generated/prisma/client.js';
import { canWriteContext } from '../../organisation/permissions/contextPermissions.js';

/**
 * Whether the user may initiate a same-owner move from the document's current context.
 * Same gate as publish: scope lead / personal owner / admin on the source context.
 * Context-free drafts cannot move (use assign).
 */
export async function canMoveDocument(
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
