import { describe, it, expect } from 'vitest';
import {
  ANNOUNCEMENT_NOTIFICATION_EVENT_TYPES,
  OPERATIONS_NOTIFICATION_EVENT_TYPES,
  ORG_NOTIFICATION_EVENT_TYPES,
  resolveNotificationPreferenceCategory,
  SYSTEM_NOTIFICATION_EVENT_TYPES,
  isNotificationPreferenceEnabled,
} from '../notificationEventTypes.js';
import { parseMentionUserIds } from '../services/commentMentionParser.js';

describe('resolveNotificationPreferenceCategory', () => {
  it('maps org events to orgChanges', () => {
    expect(resolveNotificationPreferenceCategory('team-member-added')).toBe('orgChanges');
    expect(resolveNotificationPreferenceCategory('admin-granted')).toBe('orgChanges');
  });

  it('maps admin broadcast to announcements and backup/export to operations', () => {
    expect(resolveNotificationPreferenceCategory('admin-broadcast')).toBe('announcements');
    expect(resolveNotificationPreferenceCategory('backup-failed')).toBe('operations');
    expect(resolveNotificationPreferenceCategory('update-available')).toBe('operations');
    expect(resolveNotificationPreferenceCategory('platform-export-succeeded')).toBe('operations');
    expect(resolveNotificationPreferenceCategory('platform-import-failed')).toBe('operations');
  });

  it('falls back from legacy system pref to announcements and operations', () => {
    expect(
      isNotificationPreferenceEnabled('inApp', 'announcements', { inApp: { system: false } }, true)
    ).toBe(false);
    expect(
      isNotificationPreferenceEnabled('inApp', 'operations', { inApp: { system: true } }, false)
    ).toBe(true);
    expect(
      isNotificationPreferenceEnabled(
        'inApp',
        'announcements',
        { inApp: { announcements: false, system: true } },
        true
      )
    ).toBe(false);
  });

  it('maps comments to documentComments', () => {
    expect(resolveNotificationPreferenceCategory('document-comment-created')).toBe(
      'documentComments'
    );
  });

  it('falls back documentComments to documentChanges when unset', () => {
    expect(
      isNotificationPreferenceEnabled(
        'inApp',
        'documentComments',
        { inApp: { documentChanges: false } },
        true
      )
    ).toBe(false);
    expect(
      isNotificationPreferenceEnabled(
        'inApp',
        'documentComments',
        { inApp: { documentComments: true, documentChanges: false } },
        false
      )
    ).toBe(true);
  });
});

describe('notification event type lists', () => {
  it('includes admin-broadcast in announcement types and export in operations', () => {
    expect(ANNOUNCEMENT_NOTIFICATION_EVENT_TYPES).toContain('admin-broadcast');
    expect(OPERATIONS_NOTIFICATION_EVENT_TYPES).toContain('platform-export-succeeded');
    expect(OPERATIONS_NOTIFICATION_EVENT_TYPES).toContain('platform-import-succeeded');
    expect(OPERATIONS_NOTIFICATION_EVENT_TYPES).toContain('update-available');
    expect(SYSTEM_NOTIFICATION_EVENT_TYPES).toContain('admin-broadcast');
  });

  it('includes team membership in org types', () => {
    expect(ORG_NOTIFICATION_EVENT_TYPES).toContain('team-member-added');
  });
});

describe('parseMentionUserIds', () => {
  it('extracts cuid tokens from comment text', () => {
    const id = 'clxyz1234567890abcdefghij';
    expect(parseMentionUserIds(`Hello @[${id}] there`)).toEqual([id]);
  });
});
