/**
 * Concrete hex pairs for dark semantic tokens in `theme-dark.css`.
 * Mantine default dark scale (keep aligned with @mantine/core).
 */
export const MANTINE_DARK = {
  0: '#c9c9c9',
  1: '#b8b8b8',
  2: '#828282',
  3: '#696969',
  4: '#424242',
  5: '#3b3b3b',
  6: '#2e2e2e',
  7: '#242424',
  8: '#1f1f1f',
  9: '#141414',
} as const;

export const DARK_BODY = MANTINE_DARK[9];
export const DARK_DEFAULT = MANTINE_DARK[8];
export const DARK_TEXT = '#ffffff';
/** `--mantine-color-dimmed` -> dark-0 in theme-dark.css */
export const DARK_DIMMED = MANTINE_DARK[0];
export const DARK_HOVER = '#3a3a3a';
export const DARK_NAV_ACTIVE = '#3b4045';

export type DarkContrastPair = {
  name: string;
  foreground: string;
  background: string;
  /** Minimum ratio (WCAG AA normal 4.5 or large/UI 3). */
  minRatio: number;
};

export const DARK_THEME_CONTRAST_PAIRS: readonly DarkContrastPair[] = [
  { name: 'text on body', foreground: DARK_TEXT, background: DARK_BODY, minRatio: 4.5 },
  { name: 'dimmed on body', foreground: DARK_DIMMED, background: DARK_BODY, minRatio: 4.5 },
  {
    name: 'text on default (cards)',
    foreground: DARK_TEXT,
    background: DARK_DEFAULT,
    minRatio: 4.5,
  },
  {
    name: 'dimmed on default',
    foreground: DARK_DIMMED,
    background: DARK_DEFAULT,
    minRatio: 4.5,
  },
  {
    name: 'dimmed on default-hover',
    foreground: DARK_DIMMED,
    background: DARK_HOVER,
    minRatio: 4.5,
  },
  {
    name: 'dimmed on nav active',
    foreground: DARK_DIMMED,
    background: DARK_NAV_ACTIVE,
    minRatio: 4.5,
  },
  {
    /* primary-light / blue-light dark wash -> same slate as nav active */
    name: 'text on primary-light wash',
    foreground: DARK_TEXT,
    background: DARK_NAV_ACTIVE,
    minRatio: 4.5,
  },
  {
    name: 'disabled label on default',
    foreground: MANTINE_DARK[2],
    background: DARK_DEFAULT,
    minRatio: 3,
  },
];
