import { excludeUserIds } from './notificationRecipients.js';
import { enqueueNotificationEvent } from './notificationEnqueueService.js';
import type { OrgNotificationEventType } from '../notificationEventTypes.js';

export type OrgNotificationPayload = {
  actorUserId: string;
  userId: string;
  scopeType: 'team' | 'department' | 'company' | 'platform';
  scopeId: string | null;
  scopeName: string;
};

export async function enqueueOrgNotification(args: {
  eventType: OrgNotificationEventType;
  targetUserIds: string[];
  actorUserId: string;
  payload: Omit<OrgNotificationPayload, 'actorUserId'>;
}): Promise<void> {
  const recipients = excludeUserIds(args.targetUserIds, args.actorUserId);
  if (recipients.length === 0) return;
  await enqueueNotificationEvent({
    eventType: args.eventType,
    targetUserIds: recipients,
    payload: {
      ...args.payload,
      actorUserId: args.actorUserId,
    },
  });
}

type RouteLogger = { warn: (meta: Record<string, unknown>, msg: string) => void };

export function enqueueOrgNotificationSafe(
  log: RouteLogger,
  args: Parameters<typeof enqueueOrgNotification>[0]
): void {
  void enqueueOrgNotification(args).catch((error: unknown) => {
    log.warn({ error, eventType: args.eventType }, 'Failed to enqueue org notification');
  });
}
