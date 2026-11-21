import { useComputedColorScheme } from '@mantine/core';
import { useEffect } from 'react';

/**
 * Keeps theme-color meta, favicon, and `data-theme` in sync with the resolved
 * Mantine scheme (manual toggle can diverge from prefers-color-scheme).
 * `data-theme` is what @xyflow/react 13+ uses for automatic color mode.
 */
export function LandingColorSchemeEffects() {
  const resolved = useComputedColorScheme('dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolved);

    const themeColor = resolved === 'light' ? '#f1f3f5' : '#140a2e';
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', themeColor);

    const lightIcon = document.querySelector(
      'link[rel="icon"][media="(prefers-color-scheme: light)"]'
    );
    const darkIcon = document.querySelector(
      'link[rel="icon"][media="(prefers-color-scheme: dark)"]'
    );
    const fallback = document.querySelector('link[rel="icon"]:not([media])');

    if (resolved === 'light') {
      lightIcon?.setAttribute('href', '/docops.svg');
      darkIcon?.setAttribute('href', '/docops.svg');
      fallback?.setAttribute('href', '/docops.svg');
    } else {
      lightIcon?.setAttribute('href', '/docops-dark.svg');
      darkIcon?.setAttribute('href', '/docops-dark.svg');
      fallback?.setAttribute('href', '/docops-dark.svg');
    }
  }, [resolved]);

  return null;
}
