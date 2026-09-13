import { Button, Group, Pagination, Select, Stack, Table, Text, TextInput } from '@mantine/core';
import { useIntersection, useMediaQuery } from '@mantine/hooks';
import { IconArchiveOff, IconRefresh } from '@tabler/icons-react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { WIDE_MIN_WIDTH } from '../appShell/appShellLayoutConstants.js';
import { formatTableDate } from '../../lib/formatDate';
import type { PageMobileAction } from '../ui/PageMobileActionBar.js';
import { EntityListCard } from '../ui/EntityListCard.js';
import { useRegisterPageMobileExtraActions } from '../ui/pageMobileNav.js';
import {
  CompactListCount,
  useCompactListFilterFab,
  useCompactListSearchFab,
} from '../ui/StickySearchChrome.js';
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
  const isWide = useMediaQuery(WIDE_MIN_WIDTH) ?? true;
  const compact = !isWide;
  const closeSearchRef = useRef<() => void>(() => {});
  const closeFilterRef = useRef<() => void>(() => {});
  const state = useTrashArchiveTabState({
    variant,
    scope,
    companyId,
    departmentId,
    teamId,
    compact,
  });

  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const { ref: intersectionRef, entry } = useIntersection({
    root: null,
    threshold: 0.1,
  });

  const { hasMore, loadingMore, loadMore } = state;

  useEffect(() => {
    if (!compact || !hasMore || loadingMore) return;
    if (entry?.isIntersecting) loadMore();
  }, [compact, entry?.isIntersecting, hasMore, loadMore, loadingMore]);

  const setLoadMoreNode = useCallback(
    (node: HTMLDivElement | null) => {
      loadMoreRef.current = node;
      intersectionRef(node);
    },
    [intersectionRef]
  );

  const typeSelect = (
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
  );

  const compactFilter = useCompactListFilterFab({
    label: t('documents:catalog.filterButton'),
    active: Boolean(state.typeFilter),
    onOpen: () => closeSearchRef.current(),
    children: typeSelect,
  });

  const compactSearch = useCompactListSearchFab({
    label: t('common:actions.search'),
    placeholder: t('documents:trashArchive.searchPlaceholder'),
    value: state.localSearch,
    onChange: (e) => state.setFilter(state.searchParamKey, e.currentTarget.value),
    onClear: () => state.setFilter(state.searchParamKey, null),
    onOpen: () => closeFilterRef.current(),
  });

  closeSearchRef.current = compactSearch.close;
  closeFilterRef.current = compactFilter.close;

  const compactExtraActions = useMemo(
    (): PageMobileAction[] => [compactSearch.action, compactFilter.action],
    [compactSearch.action, compactFilter.action]
  );

  useRegisterPageMobileExtraActions(compactExtraActions, compact);

  if (state.isPending) {
    return (
      <Text size="sm" c="dimmed">
        {state.loadingLabel}
      </Text>
    );
  }

  const countText = state.localSearch.trim()
    ? t('documents:trashArchive.itemsOfTotal', {
        count: state.total,
        filtered: state.filteredItems.length,
      })
    : t('documents:trashArchive.itemsTotal', { count: state.total });

  return (
    <Stack gap={compact ? 'sm' : 'md'}>
      {compact ? (
        <>
          {compactSearch.panel}
          {compactFilter.panel}
        </>
      ) : null}
      {isWide ? (
        <Group gap="md" wrap="wrap" align="flex-end">
          <TextInput
            label={t('common:actions.search')}
            placeholder={t('documents:trashArchive.searchPlaceholder')}
            value={state.localSearch}
            onChange={(e) => state.setFilter(state.searchParamKey, e.currentTarget.value)}
            style={{ minWidth: 200 }}
          />
          {typeSelect}
          <Text size="sm" c="dimmed" style={{ marginLeft: 'auto' }}>
            {countText}
          </Text>
          <Select
            label={t('documents:catalog.perPage')}
            data={PAGE_SIZE_OPTIONS.map((n) => ({ value: String(n), label: String(n) }))}
            value={String(state.limit)}
            onChange={(v) => v && state.setPageSize(parseInt(v, 10))}
            style={{ width: 90 }}
          />
        </Group>
      ) : (
        <CompactListCount>{countText}</CompactListCount>
      )}

      {isWide ? (
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
      ) : state.filteredItems.length === 0 ? (
        <Text size="sm" c="dimmed">
          {state.sortedItems.length === 0
            ? state.emptyAllLabel
            : t('documents:trashArchive.noSearchMatch')}
        </Text>
      ) : (
        <Stack gap="xs">
          {state.filteredItems.map((item) => (
            <EntityListCard
              key={`${item.type}-${item.id}`}
              onClick={() => {
                void navigate(itemHref(item));
              }}
              title={item.displayTitle || item.id}
              meta={
                <Stack gap={2}>
                  <Text size="xs" c="dimmed" tt="capitalize">
                    {item.type}
                    {item.contextName ? ` · ${item.contextName}` : ''}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {state.dateValue(item)
                      ? formatTableDate(state.dateValue(item)!, { withTime: true })
                      : '–'}
                  </Text>
                </Stack>
              }
              rightSection={
                variant === 'trash' ? (
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
                )
              }
            />
          ))}
          {state.hasMore ? (
            <div ref={setLoadMoreNode}>
              <Button
                fullWidth
                variant="subtle"
                size="sm"
                loading={state.loadingMore}
                onClick={() => state.loadMore()}
              >
                {t('documents:trashArchive.loadMore')}
              </Button>
            </div>
          ) : null}
        </Stack>
      )}

      {isWide ? (
        <Group justify="flex-end">
          <Pagination
            total={state.totalPages}
            value={state.page}
            onChange={state.setPage}
            size="sm"
          />
        </Group>
      ) : null}
    </Stack>
  );
}
