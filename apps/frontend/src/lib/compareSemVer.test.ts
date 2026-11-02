import { describe, expect, it } from 'vitest';
import { compareSemVer } from './compareSemVer';

describe('compareSemVer', () => {
  it('returns 0 for equal versions', () => {
    expect(compareSemVer('0.1.0', '0.1.0')).toBe(0);
  });

  it('returns 1 when first is greater', () => {
    expect(compareSemVer('0.2.0', '0.1.0')).toBe(1);
    expect(compareSemVer('1.0.0', '0.9.9')).toBe(1);
  });

  it('returns -1 when first is smaller', () => {
    expect(compareSemVer('0.1.0', '0.2.0')).toBe(-1);
  });
});
