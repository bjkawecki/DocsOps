import { type ReactNode, useEffect, useRef } from 'react';
import { useMantineColorScheme } from '@mantine/core';
import { COLOR_SCHEME_STORAGE_KEY } from '../../constants';
import { useMe } from '../../hooks/useMe';
import { RecentItemsProvider } from '../../hooks/useRecentItems';
import type { PrimaryColorPreset, TextSizePreference } from '../../theme';

export type UserPreferences = {
  theme?: 'light' | 'dark' | 'auto';
  sidebarPinned?: boolean;
  locale?: 'en' | 'de';
  primaryColor?: PrimaryColorPreset;
  textSize?: TextSizePreference;
  recentItemsByScope?: Record<
    string,
    { type: 'process' | 'project' | 'document'; id: string; name?: string; contextName?: string }[]
  >;
  notificationSettings?: {
    inApp?: {
      documentChanges?: boolean;
      documentComments?: boolean;
      draftRequests?: boolean;
      reminders?: boolean;
      announcements?: boolean;
      operations?: boolean;
      system?: boolean;
      orgChanges?: boolean;
    };
    email?: {
      documentChanges?: boolean;
      documentComments?: boolean;
      draftRequests?: boolean;
      reminders?: boolean;
      announcements?: boolean;
      operations?: boolean;
      system?: boolean;
      orgChanges?: boolean;
    };
  };
  pulseSettings?: {
    showDrafts?: boolean;
    showReviews?: boolean;
    showNewDocuments?: boolean;
    showUpdatedDocuments?: boolean;
    showComments?: boolean;
  };
};

/**
 * Syncs the root Mantine color scheme when the stored preference changes.
 * Primary color / text size are applied by AppMantineProvider (single MantineProvider + CSS vars).
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
 * Syncs color scheme from GET /me and provides recent-items context.
 * AuthGuard already waits for me; never unmount children on preference refetch.
 * Primary color / text scale: see AppMantineProvider.
 */
export function ThemeFromPreferences({ children }: { children: ReactNode }) {
  const { data: me } = useMe();
  const preferredScheme = me?.preferences?.theme ?? 'auto';

  return (
    <>
      <SyncColorScheme preferredScheme={preferredScheme} />
      <RecentItemsProvider>{children}</RecentItemsProvider>
    </>
  );
}
