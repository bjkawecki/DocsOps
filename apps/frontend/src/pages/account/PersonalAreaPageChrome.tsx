import { Box, Container, Paper, Text } from '@mantine/core';
import { useMemo, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useRegisterScopePageChrome } from '../../components/appShell/scopeBreadcrumbs.js';
import type { AppShellBreadcrumbItem } from '../../components/appShell/AppShellBreadcrumbsContext.js';
import { PageMobileActionsHost } from '../../components/ui/pageMobileNav.js';
import { ResponsiveContentNav } from '../../components/ui/ResponsiveContentNav.js';
import { useMe } from '../../hooks/useMe';
import { canShowTrashArchiveTabs } from '../../lib/canShowWriteTabs.js';
import { ScopeContextSidebar } from '../contextWorkspace/ScopeContextSidebar.js';
import {
  scopeArchiveUrl,
  scopeMostReadUrl,
  scopeTrashUrl,
} from '../contextWorkspace/contextPaths.js';
import { useScopeSidebarNav } from '../contextWorkspace/useScopeSidebarNav.js';

const PERSONAL_SCOPE = { type: 'personal' as const };

export type PersonalAreaPageChromeProps = {
  /** Crumbs after Persönlich (e.g. Offene Vorgänge → Prüfungen). */
  trailSuffix?: AppShellBreadcrumbItem[] | null;
  reviewsNested?: ReactNode;
  reviewsCount?: number;
  movesCount?: number;
  sharedCount?: number;
  children: ReactNode;
};

/**
 * Two-column chrome for personal-area pages: same sidebar as /personal
 * (Prozesse, Projekte, Offene Vorgänge, Geteilte Dokumente, …).
 */
export function PersonalAreaPageChrome({
  trailSuffix = null,
  reviewsNested,
  reviewsCount,
  movesCount,
  sharedCount,
  children,
}: PersonalAreaPageChromeProps) {
  const { t } = useTranslation(['contexts', 'common', 'shell']);
  const navTitle = t('shell:nav.personal');
  const compactNavOpenRef = useRef<(() => void) | null>(null);
  const { data: me, isPending } = useMe();
  const { processes, projects, drafts } = useScopeSidebarNav(PERSONAL_SCOPE);
  const showTrashArchive = canShowTrashArchiveTabs(me, true);
  const suffixList = useMemo(
    (): AppShellBreadcrumbItem[] | null =>
      trailSuffix != null && trailSuffix.length > 0 ? trailSuffix : null,
    [trailSuffix]
  );
  useRegisterScopePageChrome(PERSONAL_SCOPE, t('contexts:scopeKind.personal'), null, suffixList);

  const trashArchive = showTrashArchive
    ? {
        trashTo: scopeTrashUrl(PERSONAL_SCOPE),
        archiveTo: scopeArchiveUrl(PERSONAL_SCOPE),
        mostReadTo: scopeMostReadUrl(PERSONAL_SCOPE),
      }
    : null;

  if (isPending) {
    return (
      <Text size="sm" c="dimmed">
        {t('common:status.loading')}
      </Text>
    );
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
                  // Link navigation only.
                }}
                trashArchive={trashArchive}
                showPersonalAreaPeers
                reviewsNested={reviewsNested}
                reviewsCount={reviewsCount}
                movesCount={movesCount}
                sharedCount={sharedCount}
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
