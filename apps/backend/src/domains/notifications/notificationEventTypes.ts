export const DOCUMENT_NOTIFICATION_EVENT_TYPES = [
  'document-created',
  'document-updated',
  'document-published',
  'document-archived',
  'document-deleted',
  'document-restored',
  'document-grants-changed',
  'document-comment-created',
] as const;

export const REVIEW_NOTIFICATION_EVENT_TYPES = [
  'draft-request-submitted',
  'draft-request-merged',
  'draft-request-rejected',
] as const;

export const BACKUP_SYSTEM_NOTIFICATION_EVENT_TYPES = [
  'backup-succeeded',
  'backup-failed',
  'backup-restore-succeeded',
  'backup-restore-failed',
  'platform-export-succeeded',
  'platform-export-failed',
  'platform-import-succeeded',
  'platform-import-failed',
] as const;

export const ADMIN_SYSTEM_NOTIFICATION_EVENT_TYPES = ['admin-broadcast'] as const;

export const SYSTEM_NOTIFICATION_EVENT_TYPES = [
  ...BACKUP_SYSTEM_NOTIFICATION_EVENT_TYPES,
  ...ADMIN_SYSTEM_NOTIFICATION_EVENT_TYPES,
] as const;

export const ORG_NOTIFICATION_EVENT_TYPES = [
  'team-member-added',
  'team-member-removed',
  'team-lead-assigned',
  'team-lead-removed',
  'department-lead-assigned',
  'department-lead-removed',
  'company-lead-assigned',
  'company-lead-removed',
  'admin-granted',
  'admin-revoked',
] as const;

export type OrgNotificationEventType = (typeof ORG_NOTIFICATION_EVENT_TYPES)[number];
export type SystemNotificationEventType = (typeof SYSTEM_NOTIFICATION_EVENT_TYPES)[number];

export type NotificationPreferenceCategory =
  | 'documentChanges'
  | 'draftRequests'
  | 'reminders'
  | 'system'
  | 'orgChanges';

const ORG_EVENT_TYPE_SET = new Set<string>(ORG_NOTIFICATION_EVENT_TYPES);

/** Maps event_type to Settings preference channel (inApp / email toggles). */
export function resolveNotificationPreferenceCategory(
  eventType: string
): NotificationPreferenceCategory {
  if (eventType === 'admin-broadcast' || eventType.startsWith('backup-')) return 'system';
  if (eventType.startsWith('platform-export-') || eventType.startsWith('platform-import-'))
    return 'system';
  if (ORG_EVENT_TYPE_SET.has(eventType)) return 'orgChanges';
  if (eventType.includes('draft-request')) return 'draftRequests';
  if (eventType.includes('reminder')) return 'reminders';
  return 'documentChanges';
}
