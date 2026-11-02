import { describe, expect, it } from 'vitest';
import { contrastOnAccent, contrastRatio, relativeLuminance } from './contrastRatio.js';

describe('contrastRatio', () => {
  it('returns max ratio for black on white', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
  });

  it('returns null for invalid hex', () => {
    expect(contrastRatio('nope', '#ffffff')).toBeNull();
  });
});

describe('relativeLuminance', () => {
  it('is 0 for black and 1 for white', () => {
    expect(relativeLuminance('#000000')).toBeCloseTo(0, 5);
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 5);
  });
});

describe('contrastOnAccent', () => {
  it('picks white on dark accents and black on light accents', () => {
    expect(contrastOnAccent('#1f62d4')).toBe('var(--mantine-color-white)');
    expect(contrastOnAccent('#fde68a')).toBe('var(--mantine-color-black)');
  });
});
