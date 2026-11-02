import { describe, expect, it } from 'vitest';
import {
  buildPulseBody,
  buildPulseItemId,
  coalesceCommentsByDocument,
  coalesceLatestByDocument,
  coalesceLatestByOwnerScope,
  parseHealthCheckPulseScopeKey,
  parsePulseItemId,
  resolvePulseSettings,
} from '../services/pulseService.js';

describe('pulseService helpers', () => {
  it('resolvePulseSettings defaults all true and merges overrides', () => {
    expect(resolvePulseSettings(undefined).showComments).toBe(true);
    expect(resolvePulseSettings(undefined).showHealthCheck).toBe(true);
    expect(resolvePulseSettings({ showComments: false }).showComments).toBe(false);
    expect(resolvePulseSettings({ showDrafts: false }).showNewDocuments).toBe(true);
    expect(resolvePulseSettings({ showHealthCheck: false }).showHealthCheck).toBe(false);
  });

  it('buildPulseItemId / parsePulseItemId round-trip', () => {
    const id = buildPulseItemId('document-comments', 'doc123');
    expect(id).toBe('document-comments:doc123');
    expect(parsePulseItemId(id)).toEqual({ kind: 'document-comments', documentId: 'doc123' });
    expect(parsePulseItemId('nope')).toBeNull();
    const hcId = buildPulseItemId('health-check-action-needed', 'department:dept1');
    expect(parsePulseItemId(hcId)).toEqual({
      kind: 'health-check-action-needed',
      documentId: 'department:dept1',
    });
    expect(parseHealthCheckPulseScopeKey('department:dept1')).toEqual({
      scopeType: 'department',
      scopeId: 'dept1',
    });
  });

  it('coalesceLatestByOwnerScope keeps newest per scope', () => {
    const older = {
      id: '1',
      event_type: 'health-check-action-needed',
      payload: { scopeType: 'department', scopeId: 'd1', count: 5 },
      created_at: new Date('2026-01-01T00:00:00.000Z'),
    };
    const newer = {
      id: '2',
      event_type: 'health-check-action-needed',
      payload: { scopeType: 'department', scopeId: 'd1', count: 10 },
      created_at: new Date('2026-01-02T00:00:00.000Z'),
    };
    const other = {
      id: '3',
      event_type: 'health-check-action-needed',
      payload: { scopeType: 'team', scopeId: 't1', count: 2 },
      created_at: new Date('2026-01-01T12:00:00.000Z'),
    };
    const map = coalesceLatestByOwnerScope([older, newer, other]);
    expect(map.size).toBe(2);
    expect(map.get('department:d1')?.id).toBe('2');
    expect(map.get('team:t1')?.id).toBe('3');
  });

  it('coalesceLatestByDocument keeps newest per document', () => {
    const older = {
      id: '1',
      event_type: 'document-updated',
      payload: { documentId: 'd1' },
      created_at: new Date('2026-01-01T00:00:00.000Z'),
    };
    const newer = {
      id: '2',
      event_type: 'document-updated',
      payload: { documentId: 'd1' },
      created_at: new Date('2026-01-02T00:00:00.000Z'),
    };
    const other = {
      id: '3',
      event_type: 'document-updated',
      payload: { documentId: 'd2' },
      created_at: new Date('2026-01-01T12:00:00.000Z'),
    };
    const map = coalesceLatestByDocument([older, newer, other]);
    expect(map.size).toBe(2);
    expect(map.get('d1')?.id).toBe('2');
    expect(map.get('d2')?.id).toBe('3');
  });

  it('coalesceCommentsByDocument counts and keeps newest', () => {
    const rows = [
      {
        id: 'a',
        event_type: 'document-comment-created',
        payload: { documentId: 'd1' },
        created_at: new Date('2026-01-01T00:00:00.000Z'),
      },
      {
        id: 'b',
        event_type: 'document-comment-created',
        payload: { documentId: 'd1' },
        created_at: new Date('2026-01-03T00:00:00.000Z'),
      },
      {
        id: 'c',
        event_type: 'document-comment-created',
        payload: { documentId: 'd1' },
        created_at: new Date('2026-01-02T00:00:00.000Z'),
      },
    ];
    const map = coalesceCommentsByDocument(rows);
    expect(map.get('d1')?.count).toBe(3);
    expect(map.get('d1')?.latest.id).toBe('b');
  });

  it('buildPulseBody uses category labels without colon or quantity', () => {
    expect(
      buildPulseBody({
        kind: 'document-new',
        title: 'Handbook',
        scopeName: 'Platform',
        contextName: 'Onboarding',
        contextTypeLabel: 'process',
      })
    ).toBe('New Document');

    expect(
      buildPulseBody({
        kind: 'document-comments',
        title: 'Handbook',
        scopeName: 'Platform',
        contextName: null,
        contextTypeLabel: null,
        commentCount: 5,
      })
    ).toBe('Comments');

    expect(
      buildPulseBody({
        kind: 'health-check-action-needed',
        title: 'Engineering',
        scopeName: 'Engineering',
        contextName: null,
        contextTypeLabel: null,
      })
    ).toBe('Freshness');

    expect(
      buildPulseBody({
        kind: 'review-awaiting',
        title: 'Security guidelines',
        scopeName: 'Platform',
        contextName: null,
        contextTypeLabel: null,
        pendingSuggestionCount: 3,
      })
    ).toBe('Review');
  });
});
