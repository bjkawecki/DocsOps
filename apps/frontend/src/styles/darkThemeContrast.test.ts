import { describe, expect, it } from 'vitest';
import { contrastRatio } from '../lib/contrastRatio.js';
import { DARK_THEME_CONTRAST_PAIRS } from './darkThemeContrast.pairs.js';

describe('dark theme contrast pairs', () => {
  for (const pair of DARK_THEME_CONTRAST_PAIRS) {
    it(`${pair.name} meets ${pair.minRatio}:1`, () => {
      const ratio = contrastRatio(pair.foreground, pair.background);
      expect(ratio).not.toBeNull();
      expect(ratio!).toBeGreaterThanOrEqual(pair.minRatio);
    });
  }
});
