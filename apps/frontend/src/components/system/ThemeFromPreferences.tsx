import { type ReactNode, useEffect, useMemo, useRef } from 'react';
import { MantineThemeProvider, useMantineColorScheme } from '@mantine/core';
import { COLOR_SCHEME_STORAGE_KEY } from '../../constants';
import { useMe } from '../../hooks/useMe';
import { RecentItemsProvider } from '../../hooks/useRecentItems';
import { createAppTheme, type PrimaryColorPreset, type TextSizePreference } from '../../theme';

export type UserPreferences = {
  theme?: 'light' | 'dark' | 'auto';
  sidebarPinned?: boolean;
  locale?: 'en' | 'de';
  primaryColor?: PrimaryColorPreset;
  textSize?: TextSizePreference;
  recentItemsByScope?: Record<
    string,
    { type: 'process' | 'project' | 'document'; id: string; name?: string }[]
  >;
  notificationSettings?: {
    inApp?: {
      documentChanges?: boolean;
      draftRequests?: boolean;
      reminders?: boolean;
      announcements?: boolean;
      operations?: boolean;
      system?: boolean;
      orgChanges?: boolean;
    };
    email?: {
      documentChanges?: boolean;
      draftRequests?: boolean;
      reminders?: boolean;
      announcements?: boolean;
      operations?: boolean;
      system?: boolean;
      orgChanges?: boolean;
    };
  };
};

/**
 * Syncs the root Mantine color scheme when the stored preference changes.
 * Must not nest a second MantineProvider (fights outer localStorage manager).
 * Must not depend on colorScheme/setColorScheme identity (feedback loop).
 */
function SyncColorScheme({ preferredScheme }: { preferredScheme: 'light' | 'dark' | 'auto' }) {
  const { setColorScheme } = useMantineColorScheme();
  const lastAppliedRef = useRef<'light' | 'dark' | 'auto' | null>(null);

  useEffect(() => {
    if (lastAppliedRef.current === preferredScheme) return;
    lastAppliedRef.current = preferredScheme;
    setColorScheme(preferredScheme);
    try {
      window.localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, preferredScheme);
    } catch {
      // ignore localStorage errors (e.g. private mode)
    }
    // colorScheme/setColorScheme intentionally omitted: unstable identity caused light↔auto loops
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync only when preference changes
  }, [preferredScheme]);

  return null;
}

/**
 * Applies user theme overrides (primary color, text size, color scheme) from GET /me.
 * AuthGuard already waits for me; never unmount children on preference refetch.
 */
export function ThemeFromPreferences({ children }: { children: ReactNode }) {
  const { data: me } = useMe();
  const preferences = me?.preferences;

  const primaryColor: PrimaryColorPreset = preferences?.primaryColor ?? 'blue';
  const textSize: TextSizePreference = preferences?.textSize ?? 'default';
  const theme = useMemo(() => createAppTheme(primaryColor, textSize), [primaryColor, textSize]);
  const preferredScheme = preferences?.theme ?? 'auto';

  return (
    <MantineThemeProvider theme={theme}>
      <SyncColorScheme preferredScheme={preferredScheme} />
      <RecentItemsProvider>{children}</RecentItemsProvider>
    </MantineThemeProvider>
  );
}
