import { chunkUserIdsForNotificationJobs } from './notificationRecipients.js';
import { enqueueJob } from '../../../infrastructure/jobs/client.js';

export async function enqueueNotificationEvent(args: {
  eventType: string;
  targetUserIds: string[];
  payload: Record<string, unknown>;
}): Promise<void> {
  const chunks =
    args.targetUserIds.length === 0 ? [] : chunkUserIdsForNotificationJobs(args.targetUserIds);
  for (const targetUserIds of chunks) {
    await enqueueJob('notifications.send', {
      eventType: args.eventType,
      targetUserIds,
      payload: args.payload,
    });
  }
}
