import type { PrismaClient } from '../../../generated/prisma/client.js';
import { isLiveEventsEnabled } from './liveEventConfig.js';
import { notifyLiveEvent } from './liveEventNotify.js';

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
}
