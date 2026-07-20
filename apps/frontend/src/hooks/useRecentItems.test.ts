import { describe, expect, it } from 'vitest';
import { getAggregatedRecentItems } from './useRecentItems';

describe('getAggregatedRecentItems', () => {
  it('deduplicates the same document within one scope', () => {
    const items = getAggregatedRecentItems({
      'team:t1': [
        { type: 'document', id: 'd1', name: 'Team Wiki' },
        { type: 'document', id: 'd1', name: 'Team Wiki' },
        { type: 'document', id: 'd1', name: 'Team Wiki' },
      ],
    });
    expect(items).toEqual([{ type: 'document', id: 'd1', name: 'Team Wiki' }]);
  });

  it('deduplicates the same document across scopes and keeps first occurrence', () => {
    const items = getAggregatedRecentItems({
      'team:t1': [{ type: 'document', id: 'd1', name: 'Team Wiki' }],
      'department:d1': [{ type: 'document', id: 'd1', name: 'Team Wiki' }],
    });
    expect(items).toHaveLength(1);
    expect(items[0]?.id).toBe('d1');
  });
});
