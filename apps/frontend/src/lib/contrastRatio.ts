/** Parse `#rrggbb` into 0–255 channels. */
export function parseHexRgb(hex: string): { r: number; g: number; b: number } | null {
  const raw = hex.replace('#', '').trim();
  if (raw.length !== 6) return null;
  const r = Number.parseInt(raw.slice(0, 2), 16);
  const g = Number.parseInt(raw.slice(2, 4), 16);
  const b = Number.parseInt(raw.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return null;
  return { r, g, b };
}

/** Relative luminance (sRGB), WCAG 2.x. */
export function relativeLuminance(hex: string): number | null {
  const rgb = parseHexRgb(hex);
  if (rgb == null) return null;
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
}

/** WCAG contrast ratio between two hex colors (1–21). */
export function contrastRatio(foreground: string, background: string): number | null {
  const l1 = relativeLuminance(foreground);
  const l2 = relativeLuminance(background);
  if (l1 == null || l2 == null) return null;
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Readable label/icon color on a solid accent background. */
export function contrastOnAccent(hex: string): string {
  const lum = relativeLuminance(hex);
  if (lum == null) return '#fff';
  return lum > 0.55 ? 'var(--mantine-color-black)' : 'var(--mantine-color-white)';
}

/** WCAG AA normal text. */
export const WCAG_AA_NORMAL = 4.5;

/** WCAG AA large text / UI graphics. */
export const WCAG_AA_LARGE = 3;
