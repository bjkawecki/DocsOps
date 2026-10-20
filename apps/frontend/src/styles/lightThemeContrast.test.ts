import { describe, expect, it } from 'vitest';
import { contrastRatio } from '../lib/contrastRatio.js';
import { LIGHT_THEME_CONTRAST_PAIRS } from './lightThemeContrast.pairs.js';

describe('light theme contrast pairs', () => {
  for (const pair of LIGHT_THEME_CONTRAST_PAIRS) {
    it(`${pair.name} meets ${pair.minRatio}:1`, () => {
      const ratio = contrastRatio(pair.foreground, pair.background);
      expect(ratio).not.toBeNull();
      expect(ratio!).toBeGreaterThanOrEqual(pair.minRatio);
    });
  }
});
