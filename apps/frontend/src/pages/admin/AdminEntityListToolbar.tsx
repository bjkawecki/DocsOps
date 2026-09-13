import { Group, Select, Text, TextInput } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';
import { WIDE_MIN_WIDTH } from '../../components/appShell/appShellLayoutConstants.js';
import { useRegisterPageMobileExtraActions } from '../../components/ui/pageMobileNav.js';
import {
  CompactListCount,
  useCompactListSearchFab,
} from '../../components/ui/StickySearchChrome.js';
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
} from './AdminDepartmentsTab/adminDepartmentsTabConstants';

export type AdminEntityListToolbarProps = {
  searchPlaceholder: string;
  filterText: string;
  onFilterTextChange: (value: string) => void;
  scopeSelectPlaceholder: string;
  scopeSelectData: { value: string; label: string }[];
  scopeSelectValue: string | null;
  onScopeSelectChange: (value: string | null) => void;
  scopeSelectDisabled?: boolean;
  countLine: string;
  limit: number;
  onLimitChange: (next: number) => void;
  pageSizeLocalStorageKey: string;
};

/** Filters + page size for admin entity lists (primary Create lives in shell chrome). */
export function AdminEntityListToolbar({
  searchPlaceholder,
  filterText,
  onFilterTextChange,
  scopeSelectPlaceholder,
  scopeSelectData,
  scopeSelectValue,
  onScopeSelectChange,
  scopeSelectDisabled = false,
  countLine,
  limit,
  onLimitChange,
  pageSizeLocalStorageKey,
}: AdminEntityListToolbarProps) {
  const { t } = useTranslation(['admin', 'common']);
  const isWide = useMediaQuery(WIDE_MIN_WIDTH) ?? true;

  const scopeSelect = (size: 'xs' | 'md') => (
    <Select
      placeholder={scopeSelectPlaceholder}
      size={size}
      data={scopeSelectData}
      value={scopeSelectValue ?? ''}
      onChange={(v) => onScopeSelectChange(v || null)}
      disabled={scopeSelectDisabled}
      clearable
      style={{ width: size === 'xs' ? 160 : '100%' }}
    />
  );

  const compactSearch = useCompactListSearchFab({
    label: t('common:actions.search'),
    placeholder: searchPlaceholder,
    value: filterText,
    onChange: (e) => onFilterTextChange(e.currentTarget.value),
    onClear: () => onFilterTextChange(''),
    panelExtra: scopeSelect('md'),
  });

  useRegisterPageMobileExtraActions([compactSearch.action], !isWide);

  if (!isWide) {
    return (
      <>
        {compactSearch.panel}
        <CompactListCount>{countLine}</CompactListCount>
      </>
    );
  }

  return (
    <Group mb="md" justify="space-between" wrap="wrap" gap="sm">
      <Group gap="sm" wrap="wrap">
        <TextInput
          placeholder={searchPlaceholder}
          size="xs"
          value={filterText}
          onChange={(e) => onFilterTextChange(e.currentTarget.value)}
        />
        {scopeSelect('xs')}
      </Group>
      <Group gap="sm" align="flex-end">
        <Text size="sm" c="dimmed">
          {countLine}
        </Text>
        <Select
          label={t('admin:shared.perPage')}
          data={PAGE_SIZE_OPTIONS.map((n) => ({ value: String(n), label: String(n) }))}
          value={String(limit)}
          onChange={(value) => {
            const next = Number(value ?? DEFAULT_PAGE_SIZE);
            onLimitChange(next);
            try {
              window.localStorage.setItem(pageSizeLocalStorageKey, String(next));
            } catch {
              /* ignore */
            }
          }}
          style={{ width: 100 }}
        />
      </Group>
    </Group>
  );
}
