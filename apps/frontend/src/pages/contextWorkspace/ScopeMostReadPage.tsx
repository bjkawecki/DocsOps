import { Stack, Title } from '@mantine/core';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MostReadListContent } from '../../components/mostRead/MostReadListContent.js';
import type { AppShellBreadcrumbItem } from '../../components/appShell/AppShellBreadcrumbsContext.js';
import type { TrashArchiveScope } from '../../components/trashArchive/trashArchiveTypes.js';
import type { RecentScope } from '../../hooks/useRecentItems.js';
import { ScopeLeadListPageChrome } from './ScopeLeadListPageChrome.js';

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
  const { t } = useTranslation('contexts');
  const breadcrumb = useMemo(
    (): AppShellBreadcrumbItem => ({ key: 'most-read', label: t('sidebar.mostRead') }),
    [t]
  );

  return (
    <ScopeLeadListPageChrome
      navScope={navScope}
      scopeLabel={scopeLabel}
      canManage={canManage}
      breadcrumb={breadcrumb}
    >
      <Stack gap="md">
        <Title order={3}>{t('sidebar.mostRead')}</Title>
        <MostReadListContent
          scope={listScope}
          companyId={companyId}
          departmentId={departmentId}
          teamId={teamId}
        />
      </Stack>
    </ScopeLeadListPageChrome>
  );
}
