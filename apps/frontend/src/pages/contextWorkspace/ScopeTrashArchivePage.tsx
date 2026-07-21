import { Box, Container, Flex, Paper, Text } from '@mantine/core';
import { useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { ArchiveTabContent, TrashTabContent } from '../../components/trashArchive';
import type { TrashArchiveScope } from '../../components/trashArchive/trashArchiveTypes.js';
import { useRegisterScopePageChrome } from '../../components/appShell/scopeBreadcrumbs.js';
import type { AppShellBreadcrumbItem } from '../../components/appShell/AppShellBreadcrumbsContext.js';
import { useMe } from '../../hooks/useMe';
import { canShowTrashArchiveTabs } from '../../lib/canShowWriteTabs';
import type { RecentScope } from '../../hooks/useRecentItems.js';
import { scopeToUrl } from '../../lib/scopeNav.js';
import { ScopeContextSidebar } from './ScopeContextSidebar.js';
import { scopeArchiveUrl, scopeTrashUrl } from './contextPaths.js';
import { useScopeSidebarNav } from './useScopeSidebarNav.js';

export type ScopeTrashArchiveKind = 'trash' | 'archive';

type Props = {
  navScope: RecentScope;
  trashScope: TrashArchiveScope;
  kind: ScopeTrashArchiveKind;
  scopeLabel?: string;
  canManage: boolean;
  companyId?: string;
  departmentId?: string;
  teamId?: string;
};

/**
 * Lead-only trash/archive view for a scope – same two-column chrome as the context workspace.
 */
export function ScopeTrashArchivePage({
  navScope,
  trashScope,
  kind,
  scopeLabel,
  canManage,
  companyId,
  departmentId,
  teamId,
}: Props) {
  const { data: me, isPending } = useMe();
  const allowed = canShowTrashArchiveTabs(me, canManage);
  const { processes, projects, drafts } = useScopeSidebarNav(navScope);
  const trailSuffix = useMemo((): AppShellBreadcrumbItem[] => {
    return [
      {
        key: kind,
        label: kind === 'trash' ? 'Trash' : 'Archive',
      },
    ];
  }, [kind]);
  useRegisterScopePageChrome(navScope, scopeLabel, null, trailSuffix);

  const trashArchive = {
    trashTo: scopeTrashUrl(navScope),
    archiveTo: scopeArchiveUrl(navScope),
  };

  const handleContextNavClick = () => {
    // Link navigation only; no selection toggle on trash/archive.
  };

  if (isPending) {
    return (
      <Text size="sm" c="dimmed">
        Loading…
      </Text>
    );
  }
  if (!allowed) {
    return <Navigate to={scopeToUrl(navScope)} replace />;
  }

  const contentProps = { scope: trashScope, companyId, departmentId, teamId };

  return (
    <Container fluid maw={1600} px="md" mb="xl">
      <Paper withBorder={false} p={0} radius="md">
        <Flex
          direction={{ base: 'column', lg: 'row' }}
          gap={{ base: 'md', lg: 'lg' }}
          align="flex-start"
        >
          <ScopeContextSidebar
            processes={processes}
            projects={projects}
            drafts={drafts}
            activeContextId={null}
            onContextNavClick={handleContextNavClick}
            trashArchive={trashArchive}
          />

          <Box style={{ flex: 1, minWidth: 0, width: '100%' }}>
            {kind === 'trash' ? (
              <TrashTabContent {...contentProps} />
            ) : (
              <ArchiveTabContent {...contentProps} />
            )}
          </Box>
        </Flex>
      </Paper>
    </Container>
  );
}
