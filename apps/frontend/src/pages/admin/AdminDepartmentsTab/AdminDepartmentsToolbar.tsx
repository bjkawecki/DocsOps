import { useTranslation } from 'react-i18next';
import { AdminEntityListToolbar } from '../AdminEntityListToolbar';
import { DEPARTMENTS_PAGE_SIZE_KEY } from './adminDepartmentsTabConstants';

export type AdminDepartmentsToolbarProps = {
  filterText: string;
  onFilterTextChange: (value: string) => void;
  filteredDepartmentsCount: number;
  limit: number;
  onLimitChange: (next: number) => void;
};

export function AdminDepartmentsToolbar(props: AdminDepartmentsToolbarProps) {
  const { filterText, onFilterTextChange, filteredDepartmentsCount, limit, onLimitChange } = props;
  const { t } = useTranslation('admin');

  return (
    <AdminEntityListToolbar
      searchPlaceholder={t('departments.toolbar.searchPlaceholder')}
      filterText={filterText}
      onFilterTextChange={onFilterTextChange}
      countLine={t('departments.toolbar.countLine', { count: filteredDepartmentsCount })}
      limit={limit}
      onLimitChange={onLimitChange}
      pageSizeLocalStorageKey={DEPARTMENTS_PAGE_SIZE_KEY}
    />
  );
}
