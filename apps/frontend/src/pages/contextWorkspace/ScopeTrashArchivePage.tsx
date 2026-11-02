import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ArchiveTabContent, TrashTabContent } from '../../components/trashArchive';
import type { AppShellBreadcrumbItem } from '../../components/appShell/AppShellBreadcrumbsContext.js';
import type { TrashArchiveScope } from '../../components/trashArchive/trashArchiveTypes.js';
import type { RecentScope } from '../../hooks/useRecentItems.js';
import { ScopeLeadListPageChrome } from './ScopeLeadListPageChrome.js';

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
  const { t } = useTranslation('contexts');
  const breadcrumb = useMemo(
    (): AppShellBreadcrumbItem => ({
      key: kind,
      label: kind === 'trash' ? t('sidebar.trash') : t('sidebar.archive'),
    }),
    [kind, t]
  );

  const contentProps = { scope: trashScope, companyId, departmentId, teamId };

  return (
    <ScopeLeadListPageChrome
      navScope={navScope}
      scopeLabel={scopeLabel}
      canManage={canManage}
      breadcrumb={breadcrumb}
    >
      {kind === 'trash' ? (
        <TrashTabContent {...contentProps} />
      ) : (
        <ArchiveTabContent {...contentProps} />
      )}
    </ScopeLeadListPageChrome>
  );
}
