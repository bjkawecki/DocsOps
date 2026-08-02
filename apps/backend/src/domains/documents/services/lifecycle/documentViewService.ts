import type { PrismaClient } from '../../../../../generated/prisma/client.js';
import { canWriteContext } from '../../../organisation/permissions/contextPermissions.js';

/** UTC calendar date at midnight (Date column / @db.Date). */
export function utcDateOnly(now: Date = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: string }).code === 'P2002'
  );
}

/**
 * Records one authenticated view for Explore popularity.
 * Skips drafts, trash, context-free docs, and viewers with context write (scope leads / admins).
 * Dedupes per user + UTC calendar day via DocumentView unique constraint.
 */
export async function recordDocumentView(
  prisma: PrismaClient,
  userId: string,
  documentId: string
): Promise<void> {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: { publishedAt: true, deletedAt: true, contextId: true },
  });
  if (!doc || doc.publishedAt == null || doc.deletedAt != null || doc.contextId == null) {
    return;
  }

  if (await canWriteContext(prisma, userId, doc.contextId)) {
    return;
  }

  const viewedOn = utcDateOnly();
  try {
    await prisma.$transaction(async (tx) => {
      await tx.documentView.create({
        data: { documentId, userId, viewedOn },
      });
      await tx.document.update({
        where: { id: documentId },
        data: { viewCount: { increment: 1 } },
      });
    });
  } catch (err) {
    if (isUniqueViolation(err)) return;
    throw err;
  }
}
