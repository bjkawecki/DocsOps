import type { PrismaClient } from '../../../generated/prisma/client.js';
import { isLiveEventsEnabled } from './liveEventConfig.js';
import { notifyLiveEvent } from './liveEventNotify.js';

/** Invalidate Home Pulse for a user (SSE). */
export async function notifyPulseChanged(prisma: PrismaClient, userId: string): Promise<void> {
  if (!isLiveEventsEnabled()) return;

  await notifyLiveEvent(prisma, {
    target: 'user',
    userId,
    event: { v: 1, type: 'pulse.changed' },
  });
}
