import type { PrismaClient } from '../../../generated/prisma/client.js';
import { isLiveEventsEnabled } from './liveEventConfig.js';
import { notifyLiveEvent } from './liveEventNotify.js';
import { notifyPulseChanged } from './pulseLiveEvents.js';

export async function notifyNotificationUnreadChanged(
  prisma: PrismaClient,
  userId: string
): Promise<void> {
  if (!isLiveEventsEnabled()) return;

  await notifyLiveEvent(prisma, {
    target: 'user',
    userId,
    event: { v: 1, type: 'notification.unread-changed' },
  });
  // Pulse activity (new/updated/comments/review-decided) is driven by notifications.
  await notifyPulseChanged(prisma, userId);
}
