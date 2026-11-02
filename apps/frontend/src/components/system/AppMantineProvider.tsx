import { type ReactNode, useEffect, useMemo, useState } from 'react';
import {
  localStorageColorSchemeManager,
  MantineProvider,
  type MantineColorSchemeManager,
} from '@mantine/core';
import { CodeHighlightAdapterProvider, type CodeHighlightAdapter } from '@mantine/code-highlight';
import { COLOR_SCHEME_STORAGE_KEY } from '../../constants';
import { useMe } from '../../hooks/useMe';
import {
  createAppTheme,
  PRIMARY_COLOR_PRESETS,
  type PrimaryColorPreset,
  type TextSizePreference,
} from '../../theme';

const TEXT_SIZE_PRESETS: readonly TextSizePreference[] = ['default', 'large', 'larger'];

function resolvePrimaryColor(value: string | undefined): PrimaryColorPreset {
  if (value != null && (PRIMARY_COLOR_PRESETS as readonly string[]).includes(value)) {
    return value as PrimaryColorPreset;
  }
  return 'blue';
}

function resolveTextSize(value: string | undefined): TextSizePreference {
  if (value != null && (TEXT_SIZE_PRESETS as readonly string[]).includes(value)) {
    return value as TextSizePreference;
  }
  return 'default';
}

type Props = {
  children: ReactNode;
  /** Shared with ColorSchemeScript / SyncColorScheme (single localStorage key). */
  colorSchemeManager?: MantineColorSchemeManager;
};

/**
 * Single MantineProvider for the app. Theme (primary color, text scale) comes from
 * GET /me preferences when available so CSS variables (`--mantine-primary-color-*`) update.
 * Logged-out / loading falls back to default blue.
 */
export function AppMantineProvider({ children, colorSchemeManager }: Props) {
  const { data: me } = useMe({ retry: false });
  const preferences = me?.preferences;

  const theme = useMemo(
    () =>
      createAppTheme(
        resolvePrimaryColor(preferences?.primaryColor),
        resolveTextSize(preferences?.textSize)
      ),
    [preferences?.primaryColor, preferences?.textSize]
  );

  const manager =
    colorSchemeManager ??
    localStorageColorSchemeManager({
      key: COLOR_SCHEME_STORAGE_KEY,
    });

  const [highlightAdapter, setHighlightAdapter] = useState<CodeHighlightAdapter | null>(null);
  useEffect(() => {
    let cancelled = false;
    void import('../../lib/highlightJsAdapter.js').then((m) => {
      if (!cancelled) setHighlightAdapter(m.highlightJsAdapter);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <MantineProvider theme={theme} colorSchemeManager={manager} defaultColorScheme="auto">
      {highlightAdapter ? (
        <CodeHighlightAdapterProvider adapter={highlightAdapter}>
          {children}
        </CodeHighlightAdapterProvider>
      ) : (
        children
      )}
    </MantineProvider>
  );
}
