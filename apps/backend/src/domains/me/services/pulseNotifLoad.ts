import type { PrismaClient } from '../../../../generated/prisma/client.js';
import { Prisma } from '../../../../generated/prisma/client.js';
import type { PulseNotifRow } from './pulseCoalesce.js';

export const PULSE_NEW_EVENT_TYPES = ['document-published', 'document-created'] as const;
export const PULSE_UPDATED_EVENT_TYPES = ['document-updated'] as const;
export const PULSE_COMMENT_EVENT_TYPES = ['document-comment-created'] as const;
export const PULSE_DECIDED_EVENT_TYPES = [
  'draft-request-merged',
  'draft-request-rejected',
] as const;
export const PULSE_HEALTH_CHECK_EVENT_TYPES = ['health-check-action-needed'] as const;

export async function loadUnreadNotifications(
  prisma: PrismaClient,
  userId: string,
  eventTypes: readonly string[]
): Promise<PulseNotifRow[]> {
  if (eventTypes.length === 0) return [];
  return prisma.$queryRaw<PulseNotifRow[]>(Prisma.sql`
    SELECT id, event_type, payload, created_at
    FROM user_notification
    WHERE user_id = ${userId}
      AND read_at IS NULL
      AND event_type IN (${Prisma.join([...eventTypes])})
    ORDER BY created_at DESC
  `);
}
