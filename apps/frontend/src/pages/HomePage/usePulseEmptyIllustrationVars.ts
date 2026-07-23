import { useMemo } from 'react';
import { useMantineTheme, type MantineColor } from '@mantine/core';
import type { CSSProperties } from 'react';

/**
 * Map illustration luminance bands to primary + body/text mixes so the SVG
 * follows the selected theme color in light and dark mode.
 */
export function usePulseEmptyIllustrationVars(): CSSProperties {
  const theme = useMantineTheme();
  const primary = theme.primaryColor as MantineColor;

  return useMemo(() => {
    const p = (shade: number) => `var(--mantine-color-${primary}-${shade})`;
    const body = 'var(--mantine-color-body)';
    const text = 'var(--mantine-color-text)';
    const dim = 'var(--mantine-color-dimmed)';
    const filled = `var(--mantine-color-${primary}-filled)`;

    const vars: Record<string, string> = {
      '--pulse-empty-0': `color-mix(in srgb, ${p(1)} 35%, ${body})`,
      '--pulse-empty-1': `color-mix(in srgb, ${p(2)} 40%, ${body})`,
      '--pulse-empty-2': `color-mix(in srgb, ${p(2)} 45%, ${body})`,
      '--pulse-empty-3': `color-mix(in srgb, ${p(3)} 40%, ${body})`,
      '--pulse-empty-4': `color-mix(in srgb, ${p(3)} 50%, ${body})`,
      '--pulse-empty-5': `color-mix(in srgb, ${p(4)} 55%, ${body})`,
      '--pulse-empty-6': `color-mix(in srgb, ${p(4)} 65%, ${body})`,
      '--pulse-empty-7': `color-mix(in srgb, ${p(5)} 55%, ${dim})`,
      '--pulse-empty-8': `color-mix(in srgb, ${p(5)} 70%, ${dim})`,
      '--pulse-empty-9': filled,
      '--pulse-empty-10': `color-mix(in srgb, ${p(6)} 60%, ${dim})`,
      '--pulse-empty-11': `color-mix(in srgb, ${p(7)} 50%, ${text})`,
      '--pulse-empty-12': `color-mix(in srgb, ${p(7)} 65%, ${text})`,
      '--pulse-empty-13': `color-mix(in srgb, ${p(8)} 55%, ${text})`,
      '--pulse-empty-14': `color-mix(in srgb, ${p(8)} 70%, ${text})`,
      '--pulse-empty-15': `color-mix(in srgb, ${p(9)} 60%, ${text})`,
      '--pulse-empty-16': `color-mix(in srgb, ${p(9)} 80%, ${text})`,
    };
    return vars as CSSProperties;
  }, [primary]);
}
