import { describe, it, expect } from 'vitest';
import {
  ORG_NOTIFICATION_EVENT_TYPES,
  resolveNotificationPreferenceCategory,
  SYSTEM_NOTIFICATION_EVENT_TYPES,
} from '../notificationEventTypes.js';
import { parseMentionUserIds } from '../services/commentMentionParser.js';

describe('resolveNotificationPreferenceCategory', () => {
  it('maps org events to orgChanges', () => {
    expect(resolveNotificationPreferenceCategory('team-member-added')).toBe('orgChanges');
    expect(resolveNotificationPreferenceCategory('admin-granted')).toBe('orgChanges');
  });

  it('maps admin broadcast and backup to system', () => {
    expect(resolveNotificationPreferenceCategory('admin-broadcast')).toBe('system');
    expect(resolveNotificationPreferenceCategory('backup-failed')).toBe('system');
  });

  it('maps comments to documentChanges', () => {
    expect(resolveNotificationPreferenceCategory('document-comment-created')).toBe(
      'documentChanges'
    );
  });
});

describe('notification event type lists', () => {
  it('includes admin-broadcast in system types', () => {
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
