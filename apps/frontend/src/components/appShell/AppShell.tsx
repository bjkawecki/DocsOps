import { Outlet } from 'react-router-dom';
import { AppShell as MantineAppShell, Box } from '@mantine/core';
import { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../api/client';
import type { MeResponse } from '../../api/me-types';
import { meQueryKey } from '../../hooks/useMe';
import { DocumentSearchModal } from '../search/DocumentSearchModal.js';
import { DocumentSearchProvider } from '../search/DocumentSearchContext.js';
import { useDocumentSearch } from '../search/useDocumentSearch.js';
import { SettingsModal } from '../settings/SettingsModal.js';
import { AppShellBreadcrumbBar } from './AppShellBreadcrumbBar.js';
import { AppShellBreadcrumbsProvider } from './AppShellBreadcrumbsContext.js';
import { AppShellNavScopeProvider } from './AppShellNavScopeContext.js';
import { AppShellDebugMenuSlot } from './AppShellDebugMenuSlot.js';
import { AppShellImpersonationBannerSlot } from './AppShellImpersonationBannerSlot.js';
import { AppShellTopBar } from './AppShellTopBar.js';
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
  search: ReturnType<typeof useDocumentSearch>;
  maintenanceStatus: ReturnType<typeof useMaintenanceStatus>['data'];
  updateOverlay: ReturnType<typeof useUpdateInProgressOverlay>;
  onNavigate: () => void;
};

function AppShellFrame({
  s,
  layout,
  search,
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
  const isDocumentReadingPage = /^\/documents\/[^/]+$/.test(s.location.pathname);

  return (
    <DocumentSearchProvider value={{ openSearch: search.openSearch }}>
      <AppShellBreadcrumbsProvider>
        <AppShellNavScopeProvider>
          <MantineAppShell
            navbar={{
              width: layout.navbarWidth,
              breakpoint: 'sm',
              collapsed: { mobile: layout.mobileNavbarCollapsed, desktop: false },
            }}
            padding={0}
            header={{ height: headerHeight }}
            style={{ flex: 1, minHeight: 0, height: '100%', overflow: 'hidden' }}
          >
            {headerHeight > 0 ? (
              <MantineAppShell.Header withBorder={false}>
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
            ) : null}

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
              onOpenSearch={() => search.openSearch()}
            />

            <DocumentSearchModal
              opened={search.searchModalOpen}
              onClose={search.closeSearchModal}
              modalSearch={search.modalSearch}
              setModalSearch={search.setModalSearch}
              modalSearchInputRef={search.modalSearchInputRef}
              debouncedModalSearch={search.debouncedModalSearch}
              searchInputReadyForQuery={search.searchInputReadyForQuery}
              showSearchSpinner={search.showSearchSpinner}
              searchDebouncePending={search.searchDebouncePending}
              searchEnabled={search.searchEnabled}
              searchError={search.searchError}
              searchData={search.searchData}
              goToCatalogFromModal={search.goToCatalogFromModal}
            />

            <SettingsModal />

            <MantineAppShell.Main id={MAIN_CONTENT_ID} component="main" className="app-shell-main">
              <AppShellTopBar
                mobileOpened={layout.mobileOpened}
                onToggleMobile={layout.toggleMobile}
                pathname={s.location.pathname}
                unreadNotificationsCount={s.unreadNotificationsCount}
                me={s.me}
                accountMenuOpen={s.accountMenuOpen}
                setAccountMenuOpen={s.setAccountMenuOpen}
                logout={s.logout}
              />
              <Box
                className={
                  isDocumentReadingPage
                    ? 'app-shell-main-body app-shell-main-body--document'
                    : 'app-shell-main-body'
                }
                pt={{ base: 'md', md: 'sm' }}
                pb={{ base: 'md', md: 'lg', xl: 'xl' }}
                px={{ base: 'md', md: 'lg', xl: 'xl' }}
              >
                <AppShellBreadcrumbBar />
                <AppShellImpersonationBannerSlot
                  me={s.me}
                  resolvedColorScheme={s.resolvedColorScheme}
                  stopImpersonateMutation={s.stopImpersonateMutation}
                />
                <Box
                  className={
                    isDocumentReadingPage
                      ? 'app-shell-outlet app-shell-outlet--document'
                      : 'app-shell-outlet'
                  }
                >
                  <Outlet key={s.location.pathname} />
                </Box>
              </Box>
            </MantineAppShell.Main>
          </MantineAppShell>
        </AppShellNavScopeProvider>
      </AppShellBreadcrumbsProvider>
    </DocumentSearchProvider>
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

  const search = useDocumentSearch({ bindGlobalHotkey: true });

  const handleNavigate = () => {
    layout.closeMobile();
  };

  return (
    <LiveEventsProvider>
      <Box
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100dvh',
          overflow: 'hidden',
        }}
      >
        <AppShellSkipLink />
        <AppShellFrame
          s={s}
          layout={layout}
          search={search}
          maintenanceStatus={maintenanceStatus}
          updateOverlay={updateOverlay}
          onNavigate={handleNavigate}
        />
      </Box>
    </LiveEventsProvider>
  );
}
