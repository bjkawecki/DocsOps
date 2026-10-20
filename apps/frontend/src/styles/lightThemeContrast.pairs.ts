import { PRIMARY_COLOR_PALETTES } from '../theme.js';

/**
 * Concrete hex pairs for light semantic tokens in `theme-light.css`.
 * Mantine default gray scale (keep aligned with @mantine/core).
 */
export const MANTINE_GRAY = {
  0: '#f8f9fa',
  1: '#f1f3f5',
  2: '#e9ecef',
  4: '#ced4da',
  5: '#adb5bd',
  6: '#868e96',
  7: '#495057',
  9: '#212529',
} as const;

/** Hover fill on white surfaces (`--mantine-color-default-hover` in theme-light.css). */
export const LIGHT_DEFAULT_HOVER = MANTINE_GRAY[2];

export const LIGHT_BODY = MANTINE_GRAY[1];
export const LIGHT_DEFAULT = '#ffffff';
export const LIGHT_TEXT = MANTINE_GRAY[9];
export const LIGHT_DIMMED = MANTINE_GRAY[7];
export const LIGHT_BORDER = MANTINE_GRAY[4];
/** Default blue light accent (primaryShade.light = 7). */
export const LIGHT_PRIMARY_BLUE = PRIMARY_COLOR_PALETTES.blue[7];

export type ContrastPair = {
  name: string;
  foreground: string;
  background: string;
  /** Minimum ratio (WCAG AA normal 4.5 or large/UI 3). */
  minRatio: number;
};

export const LIGHT_THEME_CONTRAST_PAIRS: readonly ContrastPair[] = [
  { name: 'text on body', foreground: LIGHT_TEXT, background: LIGHT_BODY, minRatio: 4.5 },
  { name: 'dimmed on body', foreground: LIGHT_DIMMED, background: LIGHT_BODY, minRatio: 4.5 },
  {
    name: 'text on default (cards)',
    foreground: LIGHT_TEXT,
    background: LIGHT_DEFAULT,
    minRatio: 4.5,
  },
  { name: 'dimmed on default', foreground: LIGHT_DIMMED, background: LIGHT_DEFAULT, minRatio: 4.5 },
  {
    name: 'anchor / primary (blue-7) on body',
    foreground: LIGHT_PRIMARY_BLUE,
    background: LIGHT_BODY,
    minRatio: 4.5,
  },
  {
    name: 'white on primary filled (blue-7)',
    foreground: '#ffffff',
    background: LIGHT_PRIMARY_BLUE,
    minRatio: 4.5,
  },
  {
    name: 'light-variant label (blue-8) on light chip bg',
    foreground: PRIMARY_COLOR_PALETTES.blue[8],
    /** Approximate Mantine light-tint over white (axe sample for Pulse chips). */
    background: '#dce5f2',
    minRatio: 4.5,
  },
];
