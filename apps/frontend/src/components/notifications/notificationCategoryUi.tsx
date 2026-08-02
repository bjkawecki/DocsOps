import type { ReactNode } from 'react';
import {
  IconBuilding,
  IconClipboardCheck,
  IconDatabase,
  IconFileText,
  IconLayoutList,
  IconMessageCircle,
  IconSpeakerphone,
} from '@tabler/icons-react';
import type { TFunction } from 'i18next';
import type { MeNotificationCategory } from './meNotificationTypes.js';

const DOCUMENT_EVENT_TYPES = new Set([
  'document-created',
  'document-updated',
  'document-published',
  'document-archived',
  'document-deleted',
  'document-restored',
  'document-moved',
  'document-grants-changed',
]);

const COMMENT_EVENT_TYPES = new Set(['document-comment-created']);

const REVIEW_EVENT_TYPES = new Set([
  'draft-request-submitted',
  'draft-request-merged',
  'draft-request-rejected',
  'document-move-requested',
  'document-move-accepted',
  'document-move-rejected',
  'document-move-withdrawn',
]);

const ANNOUNCEMENT_EVENT_TYPES = new Set(['admin-broadcast']);

const OPERATIONS_EVENT_TYPES = new Set([
  'backup-succeeded',
  'backup-failed',
  'backup-restore-succeeded',
  'backup-restore-failed',
  'platform-export-succeeded',
  'platform-export-failed',
  'platform-import-succeeded',
  'platform-import-failed',
  'update-available',
  'update-succeeded',
  'update-failed',
]);

const ORG_EVENT_TYPES = new Set([
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
]);

export type NotificationCategoryNavItem = {
  value: MeNotificationCategory;
  adminOnly?: boolean;
};

/** Category order + admin gating; labels/descriptions come from the `notifications` i18n namespace. */
export const NOTIFICATION_CATEGORY_NAV: NotificationCategoryNavItem[] = [
  { value: 'all' },
  { value: 'documents' },
  { value: 'comments' },
  { value: 'reviews' },
  { value: 'announcements' },
  { value: 'operations', adminOnly: true },
  { value: 'org' },
];

/** Maps a notification event type to its inbox category (mirrors backend filters). */
export function eventTypeToCategory(eventType: string): Exclude<MeNotificationCategory, 'all'> {
  if (COMMENT_EVENT_TYPES.has(eventType)) return 'comments';
  if (DOCUMENT_EVENT_TYPES.has(eventType)) return 'documents';
  if (REVIEW_EVENT_TYPES.has(eventType)) return 'reviews';
  if (ANNOUNCEMENT_EVENT_TYPES.has(eventType)) return 'announcements';
  if (OPERATIONS_EVENT_TYPES.has(eventType)) return 'operations';
  if (ORG_EVENT_TYPES.has(eventType)) return 'org';
  return 'documents';
}

export function categoryLabel(t: TFunction, category: MeNotificationCategory): string {
  return t(`notifications:categories.${category}.label`);
}

export function categoryDescription(
  t: TFunction,
  category: MeNotificationCategory
): string | undefined {
  const description = t(`notifications:categories.${category}.description`, {
    defaultValue: '',
  });
  return description !== '' ? description : undefined;
}

/** Icon for an inbox category (sidebar + table). */
export function NotificationCategoryIcon({
  category,
  size = 16,
}: {
  category: MeNotificationCategory;
  size?: number;
}): ReactNode {
  const props = { size, stroke: 1.5 as const, style: { flexShrink: 0 } };
  if (category === 'all') return <IconLayoutList {...props} />;
  if (category === 'documents') return <IconFileText {...props} />;
  if (category === 'comments') return <IconMessageCircle {...props} />;
  if (category === 'reviews') return <IconClipboardCheck {...props} />;
  if (category === 'announcements') return <IconSpeakerphone {...props} />;
  if (category === 'operations') return <IconDatabase {...props} />;
  return <IconBuilding {...props} />;
}
