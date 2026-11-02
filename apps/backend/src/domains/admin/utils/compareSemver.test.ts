import { describe, it, expect } from 'vitest';
import { compareSemver, normalizeReleaseVersion } from './compareSemver.js';

describe('normalizeReleaseVersion', () => {
  it('strips v prefix from release tags', () => {
    expect(normalizeReleaseVersion('v0.1.0')).toBe('0.1.0');
    expect(normalizeReleaseVersion('0.2.0')).toBe('0.2.0');
  });

  it('returns null for invalid tags', () => {
    expect(normalizeReleaseVersion('main')).toBeNull();
    expect(normalizeReleaseVersion('v1.0')).toBeNull();
  });
});

describe('compareSemver', () => {
  it('compares semver tuples', () => {
    expect(compareSemver('0.1.0', '0.2.0')).toBe(-1);
    expect(compareSemver('0.2.0', '0.1.0')).toBe(1);
    expect(compareSemver('1.0.0', '1.0.0')).toBe(0);
  });

  it('returns null for invalid input', () => {
    expect(compareSemver('bad', '0.1.0')).toBeNull();
  });
});
