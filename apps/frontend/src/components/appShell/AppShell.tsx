import { Outlet } from 'react-router-dom';
import { AppShell as MantineAppShell, Box } from '@mantine/core';
import { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../api/client';
import type { MeResponse } from '../../api/me-types';
import { meQueryKey } from '../../hooks/useMe';
import { AppShellDebugMenuSlot } from './AppShellDebugMenuSlot.js';
import { AppShellImpersonationBannerSlot } from './AppShellImpersonationBannerSlot.js';
import { AppShellMainToolbar } from './AppShellMainToolbar.js';
import { AppShellNavbar } from './AppShellNavbar.js';
import { AppShellSkipLink } from './AppShellSkipLink.js';
import { useMaintenanceStatus } from '../../hooks/useMaintenanceStatus.js';
import { useUpdateInProgressOverlay } from '../../hooks/useUpdateInProgressOverlay.js';
import { LiveEventsProvider } from '../../hooks/LiveEventsProvider.js';
import { useLiveEventsContext } from '../../hooks/liveEventsContext.js';
import {
  AppShellHeaderBanners,
  countVisibleAppShellHeaderBanners,
} from './AppShellHeaderBanners.js';
import { APP_SHELL_STATUS_BANNER_ROW_HEIGHT } from './AppShellStatusBannerBar.js';
import { useAppShellSidebarData } from './useAppShellSidebarData.js';
import { useAppShellLayout } from './useAppShellLayout.js';
import {
  readSidebarCollapsedPreference,
  writeSidebarCollapsedPreference,
} from '../../lib/sidebarCollapsedPreference.js';
import { MAIN_CONTENT_ID } from './appShellLayoutConstants.js';
import './AppShell.css';

type AppShellFrameProps = {
  s: ReturnType<typeof useAppShellSidebarData>;
  layout: ReturnType<typeof useAppShellLayout>;
  maintenanceStatus: ReturnType<typeof useMaintenanceStatus>['data'];
  updateOverlay: ReturnType<typeof useUpdateInProgressOverlay>;
  onNavigate: () => void;
};

function AppShellFrame({
  s,
  layout,
  maintenanceStatus,
  updateOverlay,
  onNavigate,
}: AppShellFrameProps) {
  const { status: liveEventsStatus } = useLiveEventsContext();
  const headerBannerCount = countVisibleAppShellHeaderBanners({
    updateVisible: updateOverlay.visible,
    maintenanceStatus,
    liveEventsStatus,
  });
  const headerHeight = headerBannerCount * APP_SHELL_STATUS_BANNER_ROW_HEIGHT;

  return (
    <MantineAppShell
      navbar={{
        width: layout.navbarWidth,
        breakpoint: 'sm',
        collapsed: { mobile: layout.mobileNavbarCollapsed, desktop: false },
      }}
      padding={0}
      header={{ height: headerHeight }}
      style={{ flex: 1, minHeight: 0 }}
    >
      <MantineAppShell.Header>
        <AppShellHeaderBanners
          updateVisible={updateOverlay.visible}
          updatePhase={updateOverlay.phase}
          onUpdateReload={() => {
            updateOverlay.dismiss();
            window.location.reload();
          }}
          maintenanceStatus={maintenanceStatus}
        />
      </MantineAppShell.Header>

      <AppShellDebugMenuSlot
        show={s.showDebugMenu}
        adminUsersLoading={s.adminUsersLoading}
        adminUsersError={s.adminUsersError}
        adminUsers={s.adminUsersRes?.items}
        impersonateMutation={s.impersonateMutation}
        resetPlatformMutation={s.resetPlatformMutation}
        reseedPlatformMutation={s.reseedPlatformMutation}
      />

      <AppShellNavbar
        s={s}
        isMiniRail={layout.isMiniRail}
        showDesktopToggle={layout.showDesktopToggle}
        onToggleDesktop={layout.toggleDesktopCollapsed}
        onNavigate={onNavigate}
      />

      <MantineAppShell.Main id={MAIN_CONTENT_ID} component="main">
        <Box
          pt={{ base: 'md', md: 'sm' }}
          pb={{ base: 'md', md: 'lg', xl: 'xl' }}
          px={{ base: 'md', md: 'lg', xl: 'xl' }}
          style={{ minHeight: '100%' }}
        >
          <AppShellMainToolbar
            mobileOpened={layout.mobileOpened}
            onToggleMobile={layout.toggleMobile}
          />
          <AppShellImpersonationBannerSlot
            me={s.me}
            resolvedColorScheme={s.resolvedColorScheme}
            stopImpersonateMutation={s.stopImpersonateMutation}
          />
          <Outlet />
        </Box>
      </MantineAppShell.Main>
    </MantineAppShell>
  );
}

export function AppShell() {
  const s = useAppShellSidebarData();
  const isAdmin = s.me?.user?.isAdmin === true;
  const maintenanceQuery = useMaintenanceStatus();
  const maintenanceStatus = maintenanceQuery.data;
  const updateOverlay = useUpdateInProgressOverlay(isAdmin);
  const sidebarPinned = s.me?.preferences?.sidebarPinned ?? false;
  const serverSidebarCollapsed = s.me?.preferences?.sidebarCollapsed;
  const sidebarCollapsed = serverSidebarCollapsed ?? readSidebarCollapsedPreference() ?? false;
  const queryClient = useQueryClient();

  useEffect(() => {
    if (serverSidebarCollapsed !== undefined) {
      writeSidebarCollapsedPreference(serverSidebarCollapsed);
    }
  }, [serverSidebarCollapsed]);

  const patchSidebarCollapsed = useMutation({
    mutationFn: async (collapsed: boolean) => {
      const res = await apiFetch('/api/v1/me/preferences', {
        method: 'PATCH',
        body: JSON.stringify({ sidebarCollapsed: collapsed }),
      });
      if (!res.ok) throw new Error('Failed to save sidebar preference');
      return res.json() as Promise<{ sidebarCollapsed?: boolean }>;
    },
    onMutate: async (collapsed) => {
      await queryClient.cancelQueries({ queryKey: meQueryKey });
      const previousMe = queryClient.getQueryData<MeResponse>(meQueryKey);
      queryClient.setQueryData(meQueryKey, (old: MeResponse | undefined) => {
        if (!old) return old;
        return {
          ...old,
          preferences: { ...old.preferences, sidebarCollapsed: collapsed },
        };
      });
      return { previousMe };
    },
    onError: (_err, _collapsed, context) => {
      if (context?.previousMe) {
        queryClient.setQueryData(meQueryKey, context.previousMe);
      }
    },
  });

  const layout = useAppShellLayout(
    s.location.pathname,
    sidebarPinned,
    sidebarCollapsed,
    (collapsed) => {
      writeSidebarCollapsedPreference(collapsed);
      patchSidebarCollapsed.mutate(collapsed);
    }
  );

  const handleNavigate = () => {
    layout.closeMobile();
  };

  return (
    <LiveEventsProvider>
      <Box style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
        <AppShellSkipLink />
        <AppShellFrame
          s={s}
          layout={layout}
          maintenanceStatus={maintenanceStatus}
          updateOverlay={updateOverlay}
          onNavigate={handleNavigate}
        />
      </Box>
    </LiveEventsProvider>
  );
}
