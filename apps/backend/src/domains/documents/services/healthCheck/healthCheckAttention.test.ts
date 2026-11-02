import { describe, it, expect } from 'vitest';
import {
  attentionHintSortRank,
  computeAttentionHint,
  HEALTH_CHECK_ATTENTION_MIN_VIEWS,
} from './healthCheckAttention.js';

describe('healthCheckAttention', () => {
  const now = new Date('2024-06-01T12:00:00.000Z');
  const publishedOld = new Date('2024-01-01T00:00:00.000Z'); // ~152 days before now
  const publishedRecent = new Date('2024-05-20T00:00:00.000Z'); // ~12 days

  it('returns high_traffic when views and age clear thresholds', () => {
    expect(
      computeAttentionHint({
        viewCount: HEALTH_CHECK_ATTENTION_MIN_VIEWS,
        publishedAt: publishedOld,
        intervalDays: 90,
        now,
      })
    ).toBe('high_traffic');
  });

  it('returns null when viewCount below minimum', () => {
    expect(
      computeAttentionHint({
        viewCount: HEALTH_CHECK_ATTENTION_MIN_VIEWS - 1,
        publishedAt: publishedOld,
        intervalDays: 90,
        now,
      })
    ).toBeNull();
  });

  it('returns null when age below half interval', () => {
    expect(
      computeAttentionHint({
        viewCount: 20,
        publishedAt: publishedRecent,
        intervalDays: 90,
        now,
      })
    ).toBeNull();
  });

  it('returns null without publishedAt', () => {
    expect(
      computeAttentionHint({
        viewCount: 20,
        publishedAt: null,
        intervalDays: 90,
        now,
      })
    ).toBeNull();
  });

  it('ranks high_traffic before null for hub sort', () => {
    expect(attentionHintSortRank('high_traffic')).toBeLessThan(attentionHintSortRank(null));
  });
});
