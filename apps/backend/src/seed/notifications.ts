import { randomUUID } from 'node:crypto';
import { Prisma } from '../../generated/prisma/client.js';
import type { PrismaClient } from '../../generated/prisma/client.js';

type SeedNotif = {
  eventType: string;
  payload: Record<string, unknown>;
};

/**
 * Unread sample inbox rows so Home Updates/Comments are visible after CSV seed.
 * Targets platform admins and the first company-lead seed user when present.
 */
export async function seedHomeDemoNotifications(prisma: PrismaClient): Promise<void> {
  const docs = await prisma.document.findMany({
    where: { deletedAt: null, publishedAt: { not: null } },
    select: { id: true, title: true },
    orderBy: { createdAt: 'asc' },
    take: 4,
  });
  if (docs.length === 0) return;

  const recipientIds = new Set<string>();
  const admins = await prisma.user.findMany({
    where: { isAdmin: true, deletedAt: null },
    select: { id: true },
  });
  for (const a of admins) recipientIds.add(a.id);

  const companyLead = await prisma.user.findFirst({
    where: { email: 'user1@example.com', deletedAt: null },
    select: { id: true },
  });
  if (companyLead) recipientIds.add(companyLead.id);

  if (recipientIds.size === 0) {
    const fallback = await prisma.user.findFirst({
      where: { deletedAt: null },
      orderBy: { id: 'asc' },
      select: { id: true },
    });
    if (fallback) recipientIds.add(fallback.id);
  }
  if (recipientIds.size === 0) return;

  const d0 = docs[0];
  const d1 = docs[1] ?? d0;
  const d2 = docs[2] ?? d0;
  if (d0 == null) return;

  const samples: SeedNotif[] = [
    {
      eventType: 'document-published',
      payload: {
        documentId: d0.id,
        documentTitle: d0.title,
      },
    },
    {
      eventType: 'document-updated',
      payload: {
        documentId: d1.id,
        documentTitle: d1.title,
      },
    },
    {
      eventType: 'document-comment-created',
      payload: {
        documentId: d2.id,
        documentTitle: d2.title,
        commentId: randomUUID(),
        commentPreview: 'Seed demo comment for Home Comments section.',
        kind: 'mention',
      },
    },
    {
      eventType: 'document-comment-created',
      payload: {
        documentId: d0.id,
        documentTitle: d0.title,
        commentId: randomUUID(),
        commentPreview: 'Another seed comment thread reply.',
        kind: 'reply',
      },
    },
  ];

  for (const userId of recipientIds) {
    for (const sample of samples) {
      await prisma.$executeRaw(Prisma.sql`
        INSERT INTO user_notification (id, user_id, event_type, payload, created_at, read_at)
        VALUES (
          ${randomUUID()},
          ${userId},
          ${sample.eventType},
          ${JSON.stringify(sample.payload)}::jsonb,
          NOW(),
          NULL
        )
      `);
    }
  }
}
