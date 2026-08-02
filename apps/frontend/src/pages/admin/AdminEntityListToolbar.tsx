import { Group, Select, Text, TextInput } from '@mantine/core';
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
  return (
    <Group mb="md" justify="space-between" wrap="wrap" gap="sm">
      <Group gap="sm" wrap="wrap">
        <TextInput
          placeholder={searchPlaceholder}
          size="xs"
          value={filterText}
          onChange={(e) => onFilterTextChange(e.currentTarget.value)}
        />
        <Select
          placeholder={scopeSelectPlaceholder}
          size="xs"
          data={scopeSelectData}
          value={scopeSelectValue ?? ''}
          onChange={(v) => onScopeSelectChange(v || null)}
          disabled={scopeSelectDisabled}
          clearable
          style={{ width: 160 }}
        />
      </Group>
      <Group gap="sm" align="flex-end">
        <Text size="sm" c="dimmed">
          {countLine}
        </Text>
        <Select
          label="Per page"
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
