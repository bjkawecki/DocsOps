import type { PrismaClient } from '../../../../generated/prisma/client.js';
import { Prisma } from '../../../../generated/prisma/client.js';
import { notifyNotificationUnreadChanged } from '../../../infrastructure/liveEvents/notificationLiveEvents.js';
import { parsePulseItemId } from './pulseCoalesce.js';

const NEW_EVENT_TYPES = ['document-published', 'document-created'] as const;
const UPDATED_EVENT_TYPES = ['document-updated'] as const;
const COMMENT_EVENT_TYPES = ['document-comment-created'] as const;
const DECIDED_EVENT_TYPES = ['draft-request-merged', 'draft-request-rejected'] as const;

export type MarkPulseItemReadResult =
  | { ok: true; marked: number }
  | { ok: false; status: 400 | 404; error: string };

/**
 * Marks underlying unread notifications for activity / review-decided pulse items.
 * Open drafts and review-awaiting cannot be dismissed via read.
 */
export async function markPulseItemRead(
  prisma: PrismaClient,
  userId: string,
  itemId: string
): Promise<MarkPulseItemReadResult> {
  const parsed = parsePulseItemId(itemId);
  if (!parsed) return { ok: false, status: 404, error: 'Pulse item not found' };

  if (parsed.kind === 'draft-open' || parsed.kind === 'review-awaiting') {
    return {
      ok: false,
      status: 400,
      error: 'This pulse item is cleared when the draft or review work is completed',
    };
  }

  let eventTypes: readonly string[];
  switch (parsed.kind) {
    case 'document-new':
      eventTypes = NEW_EVENT_TYPES;
      break;
    case 'document-updated':
      eventTypes = UPDATED_EVENT_TYPES;
      break;
    case 'document-comments':
      eventTypes = COMMENT_EVENT_TYPES;
      break;
    case 'review-decided':
      eventTypes = DECIDED_EVENT_TYPES;
      break;
    default:
      return { ok: false, status: 404, error: 'Pulse item not found' };
  }

  const rows = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    UPDATE user_notification
    SET read_at = COALESCE(read_at, NOW())
    WHERE user_id = ${userId}
      AND read_at IS NULL
      AND event_type IN (${Prisma.join([...eventTypes])})
      AND payload->>'documentId' = ${parsed.documentId}
    RETURNING id
  `);

  if (rows.length === 0) {
    return { ok: false, status: 404, error: 'Pulse item not found' };
  }

  await notifyNotificationUnreadChanged(prisma, userId);
  return { ok: true, marked: rows.length };
}
