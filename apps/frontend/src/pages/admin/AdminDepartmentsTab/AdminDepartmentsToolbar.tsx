import { useTranslation } from 'react-i18next';
import { AdminEntityListToolbar } from '../AdminEntityListToolbar';
import { DEPARTMENTS_PAGE_SIZE_KEY } from './adminDepartmentsTabConstants';

export type AdminDepartmentsToolbarProps = {
  filterText: string;
  onFilterTextChange: (value: string) => void;
  filterCompanyId: string | null;
  onFilterCompanyIdChange: (value: string | null) => void;
  companyOptions: { value: string; label: string }[];
  filteredDepartmentsCount: number;
  limit: number;
  onLimitChange: (next: number) => void;
};

export function AdminDepartmentsToolbar(props: AdminDepartmentsToolbarProps) {
  const {
    filterText,
    onFilterTextChange,
    filterCompanyId,
    onFilterCompanyIdChange,
    companyOptions,
    filteredDepartmentsCount,
    limit,
    onLimitChange,
  } = props;
  const { t } = useTranslation('admin');

  return (
    <AdminEntityListToolbar
      searchPlaceholder={t('departments.toolbar.searchPlaceholder')}
      filterText={filterText}
      onFilterTextChange={onFilterTextChange}
      scopeSelectPlaceholder={t('departments.toolbar.companyPlaceholder')}
      scopeSelectData={companyOptions}
      scopeSelectValue={filterCompanyId}
      onScopeSelectChange={onFilterCompanyIdChange}
      countLine={t('departments.toolbar.countLine', { count: filteredDepartmentsCount })}
      limit={limit}
      onLimitChange={onLimitChange}
      pageSizeLocalStorageKey={DEPARTMENTS_PAGE_SIZE_KEY}
    />
  );
}
