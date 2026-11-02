import { Prisma } from '../../../../generated/prisma/client.js';
import type { PrismaClient } from '../../../../generated/prisma/client.js';
import { canRead } from '../../documents/permissions/canRead.js';

function documentIdFromPayload(payload: unknown): string | null {
  if (payload == null || typeof payload !== 'object' || Array.isArray(payload)) return null;
  const documentId = (payload as Record<string, unknown>).documentId;
  return typeof documentId === 'string' && documentId.length > 0 ? documentId : null;
}

/**
 * Removes stored inbox rows whose document the user can no longer read
 * (e.g. legacy seed/admin broadcast before company-only admin visibility).
 * Notifications without a documentId (broadcasts, etc.) are kept.
 */
export async function purgeUnreadableDocumentNotifications(
  prisma: PrismaClient,
  userId: string
): Promise<number> {
  const rows = await prisma.$queryRaw<Array<{ id: string; payload: unknown }>>(Prisma.sql`
    SELECT id, payload
    FROM user_notification
    WHERE user_id = ${userId}
  `);
  if (rows.length === 0) return 0;

  const canReadByDocId = new Map<string, boolean>();
  const toDelete: string[] = [];

  for (const row of rows) {
    const documentId = documentIdFromPayload(row.payload);
    if (documentId == null) continue;

    let readable = canReadByDocId.get(documentId);
    if (readable === undefined) {
      readable = await canRead(prisma, userId, documentId);
      canReadByDocId.set(documentId, readable);
    }
    if (!readable) toDelete.push(row.id);
  }

  if (toDelete.length === 0) return 0;

  await prisma.$executeRaw(Prisma.sql`
    DELETE FROM user_notification
    WHERE user_id = ${userId}
      AND id IN (${Prisma.join(toDelete)})
  `);
  return toDelete.length;
}
