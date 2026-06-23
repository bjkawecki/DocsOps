import type { PrismaClient } from '../../../generated/prisma/client.js';
import { isLiveEventsEnabled } from './liveEventConfig.js';
import { notifyLiveEvent } from './liveEventNotify.js';

export async function notifyDocumentCollaborationChanged(
  prisma: PrismaClient,
  userId: string,
  documentId: string
): Promise<void> {
  if (!isLiveEventsEnabled()) return;

  await notifyLiveEvent(prisma, {
    target: 'user',
    userId,
    event: {
      v: 1,
      type: 'document.collaboration-changed',
      payload: { documentId },
    },
  });
}

export async function notifyDocumentCollaborationChangedMany(
  prisma: PrismaClient,
  userIds: string[],
  documentId: string
): Promise<void> {
  if (!isLiveEventsEnabled() || userIds.length === 0) return;

  const unique = [...new Set(userIds)];
  await Promise.all(
    unique.map((userId) => notifyDocumentCollaborationChanged(prisma, userId, documentId))
  );
}

/** Non-blocking collaboration SSE for routes and services. */
export function notifyDocumentCollaborationChangedManyFireAndForget(
  prisma: PrismaClient,
  userIds: string[],
  documentId: string
): void {
  void notifyDocumentCollaborationChangedMany(prisma, userIds, documentId).catch(() => {
    // live events are best-effort
  });
}
