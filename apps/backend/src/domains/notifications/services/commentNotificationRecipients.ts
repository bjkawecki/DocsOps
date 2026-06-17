import type { PrismaClient } from '../../../../generated/prisma/client.js';
import { excludeUserIds, listUserIdsWhoCanReadDocument } from './notificationRecipients.js';
import { parseMentionUserIds } from './commentMentionParser.js';

export type CommentNotificationKind = 'mention' | 'reply' | 'thread';

export async function listCommentNotificationRecipientIds(args: {
  prisma: PrismaClient;
  documentId: string;
  authorUserId: string;
  parentId: string | null;
  text: string;
}): Promise<{ recipientIds: string[]; kind: CommentNotificationKind }> {
  const mentionedIds = parseMentionUserIds(args.text);
  const readerIds = new Set(await listUserIdsWhoCanReadDocument(args.prisma, args.documentId));

  const validMentioned = mentionedIds.filter((id) => readerIds.has(id));
  const recipients = new Set<string>(validMentioned);

  let kind: CommentNotificationKind = validMentioned.length > 0 ? 'mention' : 'thread';

  if (args.parentId != null) {
    const root = await args.prisma.documentComment.findFirst({
      where: { id: args.parentId, documentId: args.documentId },
      select: { id: true, authorId: true },
    });
    if (root != null) {
      recipients.add(root.authorId);
      const replies = await args.prisma.documentComment.findMany({
        where: { documentId: args.documentId, parentId: root.id },
        select: { authorId: true },
      });
      for (const reply of replies) {
        recipients.add(reply.authorId);
      }
      if (validMentioned.length === 0) kind = 'reply';
    }
  }

  return {
    recipientIds: excludeUserIds([...recipients], args.authorUserId),
    kind,
  };
}

export async function listDocumentCommentMentionCandidates(
  prisma: PrismaClient,
  documentId: string,
  limit = 100
): Promise<Array<{ id: string; name: string }>> {
  const readerIds = await listUserIdsWhoCanReadDocument(prisma, documentId);
  if (readerIds.length === 0) return [];
  const users = await prisma.user.findMany({
    where: { id: { in: readerIds.slice(0, limit) }, deletedAt: null },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
    take: limit,
  });
  return users.map((u) => ({ id: u.id, name: u.name }));
}

export async function validateCommentMentionsForDocument(
  prisma: PrismaClient,
  documentId: string,
  text: string
): Promise<{ ok: true } | { ok: false; invalidUserIds: string[] }> {
  const mentionedIds = parseMentionUserIds(text);
  if (mentionedIds.length === 0) return { ok: true };
  const readerIds = new Set(await listUserIdsWhoCanReadDocument(prisma, documentId));
  const invalid = mentionedIds.filter((id) => !readerIds.has(id));
  if (invalid.length > 0) return { ok: false, invalidUserIds: invalid };
  return { ok: true };
}
