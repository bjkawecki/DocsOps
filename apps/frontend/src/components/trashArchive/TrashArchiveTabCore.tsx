import { Button, Group, Pagination, Select, Stack, Table, Text, TextInput } from '@mantine/core';
import { IconArchiveOff, IconRefresh } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { formatTableDate } from '../../lib/formatDate';
import { SortableTableTh } from '../ui/SortableTableTh';
import type { TrashArchiveTabBaseProps } from './trashArchiveTypes';
import {
  itemHref,
  useTrashArchiveTabState,
  type TrashArchiveTabVariant,
} from './useTrashArchiveTabState.js';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

export type { TrashArchiveTabVariant };

export type TrashArchiveTabCoreProps = TrashArchiveTabBaseProps & {
  variant: TrashArchiveTabVariant;
};

export function TrashArchiveTabCore({
  variant,
  scope,
  companyId,
  departmentId,
  teamId,
}: TrashArchiveTabCoreProps) {
  const { t } = useTranslation(['documents', 'common']);
  const navigate = useNavigate();
  const state = useTrashArchiveTabState({ variant, scope, companyId, departmentId, teamId });

  if (state.isPending) {
    return (
      <Text size="sm" c="dimmed">
        {state.loadingLabel}
      </Text>
    );
  }

  return (
    <Stack gap="md">
      <Group gap="md" wrap="wrap" align="flex-end">
        <TextInput
          label={t('common:actions.search')}
          placeholder={t('documents:trashArchive.searchPlaceholder')}
          value={state.localSearch}
          onChange={(e) => state.setFilter(state.searchParamKey, e.currentTarget.value)}
          style={{ minWidth: 200 }}
        />
        <Select
          label={t('documents:trashArchive.typeLabel')}
          placeholder={t('documents:catalog.allTypes')}
          data={[
            { value: '', label: t('documents:catalog.allTypes') },
            { value: 'document', label: t('documents:trashArchive.typeDocument') },
            { value: 'process', label: t('documents:breadcrumbs.process') },
            { value: 'project', label: t('documents:breadcrumbs.project') },
          ]}
          value={state.typeFilter || null}
          onChange={(v) => state.setFilter('type', v ?? '')}
          clearable
          style={{ minWidth: 140 }}
        />
        <Text size="sm" c="dimmed" style={{ marginLeft: 'auto' }}>
          {state.localSearch.trim()
            ? t('documents:trashArchive.itemsOfTotal', {
                count: state.total,
                filtered: state.filteredItems.length,
              })
            : t('documents:trashArchive.itemsTotal', { count: state.total })}
        </Text>
        <Select
          label={t('documents:catalog.perPage')}
          data={PAGE_SIZE_OPTIONS.map((n) => ({ value: String(n), label: String(n) }))}
          value={String(state.limit)}
          onChange={(v) => v && state.setPageSize(parseInt(v, 10))}
          style={{ width: 90 }}
        />
      </Group>

      <Table withTableBorder className="dense-list-table">
        <Table.Thead>
          <Table.Tr>
            <SortableTableTh
              label={t('documents:trashArchive.typeLabel')}
              column="type"
              sortBy={state.sortBy}
              sortOrder={state.sortOrder}
              onClick={() => state.setSort('type')}
            />
            <SortableTableTh
              label={t('documents:trashArchive.table.title')}
              column="title"
              sortBy={state.sortBy}
              sortOrder={state.sortOrder}
              onClick={() => state.setSort('title')}
            />
            <SortableTableTh
              label={t('documents:trashArchive.table.context')}
              column="contextName"
              sortBy={state.sortBy}
              sortOrder={state.sortOrder}
              onClick={() => state.setSort('contextName')}
            />
            <SortableTableTh
              label={state.dateColumnLabel}
              column={state.dateSortColumn}
              sortBy={state.sortBy}
              sortOrder={state.sortOrder}
              onClick={() => state.setSort(state.dateSortColumn)}
            />
            <Table.Th>{t('documents:trashArchive.table.actions')}</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {state.filteredItems.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={5}>
                <Text size="sm" c="dimmed">
                  {state.sortedItems.length === 0
                    ? state.emptyAllLabel
                    : t('documents:trashArchive.noSearchMatch')}
                </Text>
              </Table.Td>
            </Table.Tr>
          ) : (
            state.filteredItems.map((item) => (
              <Table.Tr
                key={`${item.type}-${item.id}`}
                data-clickable-table-row
                onClick={() => {
                  void navigate(itemHref(item));
                }}
              >
                <Table.Td>
                  <Text size="sm" tt="capitalize">
                    {item.type}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text fw={500} size="sm">
                    {item.displayTitle || item.id}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c="dimmed">
                    {item.contextName}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">
                    {state.dateValue(item)
                      ? formatTableDate(state.dateValue(item)!, { withTime: true })
                      : '–'}
                  </Text>
                </Table.Td>
                <Table.Td>
                  {variant === 'trash' ? (
                    <Button
                      variant="filled"
                      size="xs"
                      leftSection={<IconRefresh size={14} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        void state.handleRestore(item);
                      }}
                    >
                      {t('documents:trashArchive.restore')}
                    </Button>
                  ) : (
                    <Button
                      variant="filled"
                      size="xs"
                      leftSection={<IconArchiveOff size={14} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        void state.handleUnarchive(item);
                      }}
                    >
                      {t('documents:trashArchive.unarchive')}
                    </Button>
                  )}
                </Table.Td>
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </Table>

      <Group justify="flex-end">
        <Pagination
          total={state.totalPages}
          value={state.page}
          onChange={state.setPage}
          size="sm"
        />
      </Group>
    </Stack>
  );
}
