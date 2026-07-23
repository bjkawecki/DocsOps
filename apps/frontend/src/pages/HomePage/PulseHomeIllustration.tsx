import { useEffect, useState } from 'react';
import { Box } from '@mantine/core';
import { usePulseEmptyIllustrationVars } from './usePulseEmptyIllustrationVars.js';

type Props = {
  /** `fill`: full aspect, absolute in empty pane. `footer`: cropped band under the feed. */
  layout: 'fill' | 'footer';
};

/**
 * Themed Pulse home illustration (inlined SVG so CSS custom properties apply).
 */
export function PulseHomeIllustration({ layout }: Props) {
  const illustVars = usePulseEmptyIllustrationVars();
  const [svgMarkup, setSvgMarkup] = useState<string | null>(null);
  /* Top of motif kept; mild bottom crop via shorter bottom-pinned band + YMin slice. */
  const preserve = 'xMidYMin slice';

  useEffect(() => {
    let cancelled = false;
    void fetch('/empty-pulse-theme.svg')
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error('svg'))))
      .then((text) => {
        if (!cancelled) {
          setSvgMarkup(
            text
              .replace(/<\?xml[^?]*\?>/i, '')
              .replace(/\s(width|height)="[^"]*"/gi, '')
              .replace(
                /<svg\b([^>]*)>/i,
                (_m, attrs: string) =>
                  `<svg${attrs.replace(/\spreserveAspectRatio="[^"]*"/i, '')} preserveAspectRatio="${preserve}">`
              )
              .trim()
          );
        }
      })
      .catch(() => {
        if (!cancelled) setSvgMarkup(null);
      });
    return () => {
      cancelled = true;
    };
  }, [preserve]);

  if (!svgMarkup) return null;

  return (
    <Box
      className={`pulse-explore-illustration-wrap pulse-explore-illustration-wrap--${layout}`}
      style={illustVars}
      aria-hidden
      dangerouslySetInnerHTML={{ __html: svgMarkup }}
    />
  );
}
