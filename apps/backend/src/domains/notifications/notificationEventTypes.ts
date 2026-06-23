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

/** Admin-only: backup, restore, platform export/import job outcomes. */
export const OPERATIONS_NOTIFICATION_EVENT_TYPES = [
  'backup-succeeded',
  'backup-failed',
  'backup-restore-succeeded',
  'backup-restore-failed',
  'platform-export-succeeded',
  'platform-export-failed',
  'platform-import-succeeded',
  'platform-import-failed',
  'update-available',
] as const;

/** @deprecated use OPERATIONS_NOTIFICATION_EVENT_TYPES */
export const BACKUP_SYSTEM_NOTIFICATION_EVENT_TYPES = OPERATIONS_NOTIFICATION_EVENT_TYPES;

export const ANNOUNCEMENT_NOTIFICATION_EVENT_TYPES = ['admin-broadcast'] as const;

/** @deprecated use ANNOUNCEMENT_NOTIFICATION_EVENT_TYPES */
export const ADMIN_SYSTEM_NOTIFICATION_EVENT_TYPES = ANNOUNCEMENT_NOTIFICATION_EVENT_TYPES;

export const SYSTEM_NOTIFICATION_EVENT_TYPES = [
  ...OPERATIONS_NOTIFICATION_EVENT_TYPES,
  ...ANNOUNCEMENT_NOTIFICATION_EVENT_TYPES,
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
  | 'announcements'
  | 'operations'
  | 'orgChanges';

type LegacyNotificationChannelPrefs = Partial<Record<NotificationPreferenceCategory, boolean>> & {
  /** Legacy combined toggle; migrated to announcements + operations. */
  system?: boolean;
};

type NotificationSettingsPrefs = {
  inApp?: LegacyNotificationChannelPrefs;
  email?: LegacyNotificationChannelPrefs;
};

export type { NotificationSettingsPrefs };

/** Reads a channel toggle; falls back to legacy `system` for announcements/operations. */
export function isNotificationPreferenceEnabled(
  channel: 'inApp' | 'email',
  category: NotificationPreferenceCategory,
  settings: NotificationSettingsPrefs | undefined,
  defaultWhenUnset: boolean
): boolean {
  const channelPrefs = settings?.[channel];
  if (channelPrefs == null) return defaultWhenUnset;
  const direct = channelPrefs[category];
  if (direct !== undefined) return direct;
  if (
    (category === 'announcements' || category === 'operations') &&
    channelPrefs['system'] !== undefined
  ) {
    return channelPrefs['system'];
  }
  return defaultWhenUnset;
}

const ORG_EVENT_TYPE_SET = new Set<string>(ORG_NOTIFICATION_EVENT_TYPES);

/** Maps event_type to Settings preference channel (inApp / email toggles). */
export function resolveNotificationPreferenceCategory(
  eventType: string
): NotificationPreferenceCategory {
  if (eventType === 'admin-broadcast') return 'announcements';
  if (eventType === 'update-available') return 'operations';
  if (eventType.startsWith('backup-')) return 'operations';
  if (eventType.startsWith('platform-export-') || eventType.startsWith('platform-import-'))
    return 'operations';
  if (ORG_EVENT_TYPE_SET.has(eventType)) return 'orgChanges';
  if (eventType.includes('draft-request')) return 'draftRequests';
  if (eventType.includes('reminder')) return 'reminders';
  return 'documentChanges';
}
