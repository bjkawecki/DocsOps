import { describe, expect, it } from 'vitest';
import { createEmptyMergeStats } from './mergeStats.js';

describe('mergeStats', () => {
  it('starts with zero counters', () => {
    const stats = createEmptyMergeStats();
    expect(stats.reused.companies).toBe(0);
    expect(stats.created.documents).toBe(0);
    expect(stats.skipped.grants).toBe(0);
  });
});
