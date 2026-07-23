import { useEffect, useLayoutEffect, useRef, useState } from 'react';
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
  const wrapRef = useRef<HTMLDivElement>(null);
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

  useLayoutEffect(() => {
    if (!svgMarkup || !wrapRef.current) return;
    const el = wrapRef.current;
    const measure = () => {
      const wr = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      // #region agent log
      fetch('http://127.0.0.1:7608/ingest/359a7e4e-9c63-4e83-9cc5-43b0546b560c', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Debug-Session-Id': 'c2113f',
        },
        body: JSON.stringify({
          sessionId: 'c2113f',
          runId: 'post-fix',
          hypothesisId: 'H10',
          location: 'PulseHomeIllustration.tsx:layout',
          message: 'illustration half-viewport cap',
          data: {
            layout,
            preserve,
            wrapW: Math.round(wr.width),
            wrapH: Math.round(wr.height),
            viewportH: window.innerHeight,
            heightRatio:
              window.innerHeight > 0 ? Number((wr.height / window.innerHeight).toFixed(3)) : null,
            gapBelowViewport: Math.round(window.innerHeight - wr.bottom),
            heightCss: cs.height,
            maxHeightCss: cs.maxHeight,
            positionCss: cs.position,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [svgMarkup, layout, preserve]);

  if (!svgMarkup) return null;

  return (
    <Box
      ref={wrapRef}
      className={`pulse-explore-illustration-wrap pulse-explore-illustration-wrap--${layout}`}
      style={illustVars}
      aria-hidden
      dangerouslySetInnerHTML={{ __html: svgMarkup }}
    />
  );
}
