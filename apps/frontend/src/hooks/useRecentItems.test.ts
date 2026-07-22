import { describe, expect, it } from 'vitest';
import { getAggregatedRecentItems } from './useRecentItems';

describe('getAggregatedRecentItems', () => {
  it('deduplicates the same document within one scope and keeps scopeKey', () => {
    const items = getAggregatedRecentItems({
      'team:t1': [
        { type: 'document', id: 'd1', name: 'Team Wiki' },
        { type: 'document', id: 'd1', name: 'Team Wiki' },
        { type: 'document', id: 'd1', name: 'Team Wiki' },
      ],
    });
    expect(items).toEqual([{ type: 'document', id: 'd1', name: 'Team Wiki', scopeKey: 'team:t1' }]);
  });

  it('deduplicates the same document across scopes and keeps first occurrence', () => {
    const items = getAggregatedRecentItems({
      'team:t1': [{ type: 'document', id: 'd1', name: 'Team Wiki' }],
      'department:d1': [{ type: 'document', id: 'd1', name: 'Team Wiki' }],
    });
    expect(items).toHaveLength(1);
    expect(items[0]?.id).toBe('d1');
    expect(items[0]?.scopeKey).toBe('team:t1');
  });

  it('preserves contextName when present', () => {
    const items = getAggregatedRecentItems({
      personal: [{ type: 'document', id: 'd1', name: 'Notes', contextName: 'My Notes Process' }],
    });
    expect(items[0]?.contextName).toBe('My Notes Process');
    expect(items[0]?.scopeKey).toBe('personal');
  });
});
