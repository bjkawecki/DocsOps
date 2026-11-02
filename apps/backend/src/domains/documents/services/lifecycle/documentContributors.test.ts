import { describe, expect, it } from 'vitest';
import { mergeContributorUserId, uniqueUserIds } from './documentContributors.js';

describe('documentContributors helpers', () => {
  it('uniqueUserIds preserves first-seen order', () => {
    expect(uniqueUserIds(['a', 'b', 'a', '', 'c', 'b'])).toEqual(['a', 'b', 'c']);
  });

  it('mergeContributorUserId appends when missing', () => {
    expect(mergeContributorUserId(['a'], 'b')).toEqual(['a', 'b']);
    expect(mergeContributorUserId(['a', 'b'], 'a')).toEqual(['a', 'b']);
  });
});
