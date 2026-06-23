import type { PrismaClient } from '../../../../../generated/prisma/client.js';
import { notifyDocumentCollaborationChangedManyFireAndForget } from '../../../../infrastructure/liveEvents/documentCollaborationLiveEvents.js';
import {
  excludeUserIds,
  listUserIdsWhoCanReadDocument,
  listUserIdsWhoCanReadLeadDraft,
} from '../../../notifications/services/notificationRecipients.js';

/** SSE to users who can see lead-draft and suggestions (writers + scope leads). */
export function notifyLeadDraftCollaborationChanged(
  prisma: PrismaClient,
  documentId: string,
  actorUserId?: string | null
): void {
  void (async () => {
    const userIds = excludeUserIds(
      await listUserIdsWhoCanReadLeadDraft(prisma, documentId),
      actorUserId
    );
    notifyDocumentCollaborationChangedManyFireAndForget(prisma, userIds, documentId);
  })();
}

/** SSE to all readers after publish (published view refresh). */
export function notifyDocumentPublishedCollaborationChanged(
  prisma: PrismaClient,
  documentId: string,
  actorUserId?: string | null
): void {
  void (async () => {
    const userIds = excludeUserIds(
      await listUserIdsWhoCanReadDocument(prisma, documentId),
      actorUserId
    );
    notifyDocumentCollaborationChangedManyFireAndForget(prisma, userIds, documentId);
  })();
}
