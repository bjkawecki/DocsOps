import { Box, Container, Flex, Paper, Stack, Text, Title } from '@mantine/core';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';
import { MostReadListContent } from '../../components/mostRead/MostReadListContent.js';
import type { TrashArchiveScope } from '../../components/trashArchive/trashArchiveTypes.js';
import { useRegisterScopePageChrome } from '../../components/appShell/scopeBreadcrumbs.js';
import type { AppShellBreadcrumbItem } from '../../components/appShell/AppShellBreadcrumbsContext.js';
import { useMe } from '../../hooks/useMe';
import { canShowTrashArchiveTabs } from '../../lib/canShowWriteTabs';
import type { RecentScope } from '../../hooks/useRecentItems.js';
import { scopeToUrl } from '../../lib/scopeNav.js';
import { ScopeContextSidebar } from './ScopeContextSidebar.js';
import { scopeArchiveUrl, scopeMostReadUrl, scopeTrashUrl } from './contextPaths.js';
import { useScopeSidebarNav } from './useScopeSidebarNav.js';

type Props = {
  navScope: RecentScope;
  listScope: TrashArchiveScope;
  scopeLabel?: string;
  canManage: boolean;
  companyId?: string;
  departmentId?: string;
  teamId?: string;
};

/**
 * Lead-only most-read view for a scope – same two-column chrome as the context workspace.
 */
export function ScopeMostReadPage({
  navScope,
  listScope,
  scopeLabel,
  canManage,
  companyId,
  departmentId,
  teamId,
}: Props) {
  const { t } = useTranslation(['contexts', 'common']);
  const { data: me, isPending } = useMe();
  const allowed = canShowTrashArchiveTabs(me, canManage);
  const { processes, projects, drafts } = useScopeSidebarNav(navScope);
  const trailSuffix = useMemo((): AppShellBreadcrumbItem[] => {
    return [{ key: 'most-read', label: t('sidebar.mostRead') }];
  }, [t]);
  useRegisterScopePageChrome(navScope, scopeLabel, null, trailSuffix);

  const trashArchive = {
    trashTo: scopeTrashUrl(navScope),
    archiveTo: scopeArchiveUrl(navScope),
    mostReadTo: scopeMostReadUrl(navScope),
  };

  const handleContextNavClick = () => {
    // Link navigation only; no selection toggle on most-read.
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
            <Stack gap="md">
              <Title order={3}>{t('sidebar.mostRead')}</Title>
              <MostReadListContent
                scope={listScope}
                companyId={companyId}
                departmentId={departmentId}
                teamId={teamId}
              />
            </Stack>
          </Box>
        </Flex>
      </Paper>
    </Container>
  );
}
