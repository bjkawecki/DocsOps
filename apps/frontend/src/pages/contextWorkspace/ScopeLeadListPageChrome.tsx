import { Box, Container, Paper, Text } from '@mantine/core';
import { useMemo, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';
import { useRegisterScopePageChrome } from '../../components/appShell/scopeBreadcrumbs.js';
import type { AppShellBreadcrumbItem } from '../../components/appShell/AppShellBreadcrumbsContext.js';
import { PageMobileActionsHost } from '../../components/ui/pageMobileNav.js';
import { ResponsiveContentNav } from '../../components/ui/ResponsiveContentNav.js';
import { useMe } from '../../hooks/useMe';
import { canShowTrashArchiveTabs } from '../../lib/canShowWriteTabs';
import type { RecentScope } from '../../hooks/useRecentItems.js';
import { scopeToUrl } from '../../lib/scopeNav.js';
import { ScopeContextSidebar } from './ScopeContextSidebar.js';
import { scopeArchiveUrl, scopeMostReadUrl, scopeTrashUrl } from './contextPaths.js';
import { useScopeSidebarNav } from './useScopeSidebarNav.js';

export type ScopeLeadListPageChromeProps = {
  navScope: RecentScope;
  scopeLabel?: string;
  canManage: boolean;
  breadcrumb: AppShellBreadcrumbItem;
  children: ReactNode;
};

/**
 * Shared two-column chrome for lead-only scope list pages (most-read, trash, archive).
 */
export function ScopeLeadListPageChrome({
  navScope,
  scopeLabel,
  canManage,
  breadcrumb,
  children,
}: ScopeLeadListPageChromeProps) {
  const { t } = useTranslation(['contexts', 'common', 'shell']);
  const navTitle = t('shell:nav.organization');
  const compactNavOpenRef = useRef<(() => void) | null>(null);
  const { data: me, isPending } = useMe();
  const allowed = canShowTrashArchiveTabs(me, canManage);
  const { processes, projects, drafts } = useScopeSidebarNav(navScope);
  const trailSuffix = useMemo((): AppShellBreadcrumbItem[] => [breadcrumb], [breadcrumb]);
  useRegisterScopePageChrome(navScope, scopeLabel, null, trailSuffix);

  const trashArchive = {
    trashTo: scopeTrashUrl(navScope),
    archiveTo: scopeArchiveUrl(navScope),
    mostReadTo: scopeMostReadUrl(navScope),
  };

  if (isPending) {
    return (
      <Text size="sm" c="dimmed">
        {t('common:status.loading')}
      </Text>
    );
  }
  if (!allowed) {
    return <Navigate to={scopeToUrl(navScope)} replace />;
  }

  return (
    <Container fluid maw={1600} px="md" mb="xl">
      <Paper withBorder={false} p={0} radius="md">
        <PageMobileActionsHost navTitle={navTitle} compactNavOpenRef={compactNavOpenRef}>
          <ResponsiveContentNav
            title={navTitle}
            compactNavOpenRef={compactNavOpenRef}
            nav={
              <ScopeContextSidebar
                processes={processes}
                projects={projects}
                drafts={drafts}
                activeContextId={null}
                onContextNavClick={() => {
                  // Link navigation only; no selection toggle on these pages.
                }}
                trashArchive={trashArchive}
                showPersonalAreaPeers={navScope.type === 'personal'}
              />
            }
          >
            <Box style={{ flex: 1, minWidth: 0, width: '100%' }}>{children}</Box>
          </ResponsiveContentNav>
        </PageMobileActionsHost>
      </Paper>
    </Container>
  );
}
