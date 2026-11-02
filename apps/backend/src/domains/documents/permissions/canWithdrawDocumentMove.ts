import type { PrismaClient } from '../../../../generated/prisma/client.js';
import { canWriteContext } from '../../organisation/permissions/contextPermissions.js';

/**
 * Whether the user may withdraw a pending move request (source-side write: requester or other lead).
 */
export async function canWithdrawDocumentMove(
  prisma: PrismaClient,
  userId: string,
  moveRequestId: string
): Promise<boolean> {
  const req = await prisma.documentMoveRequest.findUnique({
    where: { id: moveRequestId },
    select: {
      status: true,
      fromContextId: true,
      document: { select: { deletedAt: true } },
    },
  });
  if (!req || req.status !== 'pending') return false;
  if (req.document.deletedAt != null) return false;
  return canWriteContext(prisma, userId, req.fromContextId);
}
