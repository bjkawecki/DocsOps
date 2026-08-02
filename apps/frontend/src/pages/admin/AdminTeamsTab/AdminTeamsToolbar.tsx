import { useTranslation } from 'react-i18next';
import { AdminEntityListToolbar } from '../AdminEntityListToolbar';
import { TEAMS_PAGE_SIZE_KEY } from './adminTeamsTabConstants';

export type AdminTeamsToolbarProps = {
  filterText: string;
  onFilterTextChange: (value: string) => void;
  filterDepartmentId: string | null;
  onFilterDepartmentIdChange: (value: string | null) => void;
  departmentOptions: { value: string; label: string }[];
  companyId: string | null;
  filteredTeamsCount: number;
  limit: number;
  onLimitChange: (next: number) => void;
};

export function AdminTeamsToolbar(props: AdminTeamsToolbarProps) {
  const { t } = useTranslation('admin');
  const {
    filterText,
    onFilterTextChange,
    filterDepartmentId,
    onFilterDepartmentIdChange,
    departmentOptions,
    companyId,
    filteredTeamsCount,
    limit,
    onLimitChange,
  } = props;

  return (
    <AdminEntityListToolbar
      searchPlaceholder={t('teams.toolbar.searchPlaceholder')}
      filterText={filterText}
      onFilterTextChange={onFilterTextChange}
      scopeSelectPlaceholder={t('teams.toolbar.departmentPlaceholder')}
      scopeSelectData={departmentOptions}
      scopeSelectValue={filterDepartmentId}
      onScopeSelectChange={onFilterDepartmentIdChange}
      scopeSelectDisabled={!companyId}
      countLine={t('teams.toolbar.countLine', { count: filteredTeamsCount })}
      limit={limit}
      onLimitChange={onLimitChange}
      pageSizeLocalStorageKey={TEAMS_PAGE_SIZE_KEY}
    />
  );
}
