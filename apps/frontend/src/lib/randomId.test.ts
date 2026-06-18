import { describe, expect, it, vi } from 'vitest';
import { randomId } from './randomId.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('randomId', () => {
  it('returns a UUID v4 string', () => {
    expect(randomId()).toMatch(UUID_RE);
  });

  it('works when randomUUID is missing (non-secure context)', () => {
    vi.stubGlobal('crypto', {
      getRandomValues: (arr: Uint8Array) => {
        for (let i = 0; i < arr.length; i++) arr[i] = i;
        return arr;
      },
    });
    try {
      expect(randomId()).toMatch(UUID_RE);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
