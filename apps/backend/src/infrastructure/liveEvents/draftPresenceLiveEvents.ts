import type { PrismaClient } from '../../../generated/prisma/client.js';
import { isLiveEventsEnabled } from './liveEventConfig.js';
import { notifyLiveEvent } from './liveEventNotify.js';
import { listDraftEditorPresence } from '../../domains/documents/services/collaboration/draftPresenceRegistry.js';

export type DraftPresenceEditor = {
  userId: string;
  name: string;
};

export async function notifyDraftPresenceChanged(
  prisma: PrismaClient,
  userId: string,
  documentId: string
): Promise<void> {
  if (!isLiveEventsEnabled()) return;

  const editors = listDraftEditorPresence(documentId).map((e) => ({
    userId: e.userId,
    name: e.name,
  }));

  await notifyLiveEvent(prisma, {
    target: 'user',
    userId,
    event: {
      v: 1,
      type: 'document.draft-presence',
      payload: { documentId, editors },
    },
  });
}

export async function notifyDraftPresenceChangedMany(
  prisma: PrismaClient,
  userIds: string[],
  documentId: string
): Promise<void> {
  if (!isLiveEventsEnabled() || userIds.length === 0) return;
  const unique = [...new Set(userIds)];
  await Promise.all(unique.map((userId) => notifyDraftPresenceChanged(prisma, userId, documentId)));
}

export function notifyDraftPresenceChangedManyFireAndForget(
  prisma: PrismaClient,
  userIds: string[],
  documentId: string
): void {
  void notifyDraftPresenceChangedMany(prisma, userIds, documentId).catch(() => {
    // best-effort
  });
}
