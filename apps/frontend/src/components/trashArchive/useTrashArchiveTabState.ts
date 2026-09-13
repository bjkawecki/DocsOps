import { notifications } from '@mantine/notifications';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { apiFetch } from '../../api/client';
import { contextUrl } from '../../pages/contextWorkspace/contextPaths';
import type { TrashArchiveItem, TrashArchiveTabBaseProps } from './trashArchiveTypes';

const DEFAULT_PAGE_SIZE = 10;
/** Compact infinite-scroll page size. */
export const TRASH_ARCHIVE_COMPACT_PAGE_SIZE = 25;

type ListResponse = {
  items: TrashArchiveItem[];
  total: number;
  limit: number;
  offset: number;
};

export type TrashArchiveTabVariant = 'trash' | 'archive';

export type UseTrashArchiveTabStateArgs = TrashArchiveTabBaseProps & {
  variant: TrashArchiveTabVariant;
  /** When true: fixed page size + infinite scroll (no URL pagination). */
  compact?: boolean;
};

export function itemHref(item: TrashArchiveItem): string {
  if (item.type === 'document') return `/documents/${item.id}`;
  if (item.contextId) return contextUrl(item.contextId);
  return '#';
}

export function useTrashArchiveTabState({
  variant,
  scope,
  companyId,
  departmentId,
  teamId,
  compact = false,
}: UseTrashArchiveTabStateArgs) {
  const { t } = useTranslation(['documents', 'common']);
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const searchParamKey = variant === 'trash' ? 'trashSearch' : 'archiveSearch';
  const limitParamKey = variant === 'trash' ? 'trashLimit' : 'archiveLimit';
  const defaultSortBy = variant === 'trash' ? 'deletedAt' : 'archivedAt';
  const dateSortColumn = defaultSortBy;

  const typeFilter = searchParams.get('type') ?? '';
  const localSearch = searchParams.get(searchParamKey) ?? '';
  const sortBy = searchParams.get('sortBy') ?? defaultSortBy;
  const sortOrder = searchParams.get('sortOrder') ?? 'desc';
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limitParam = searchParams.get(limitParamKey);
  const limit = compact
    ? TRASH_ARCHIVE_COMPACT_PAGE_SIZE
    : limitParam
      ? Math.min(100, Math.max(1, parseInt(limitParam, 10) || DEFAULT_PAGE_SIZE))
      : DEFAULT_PAGE_SIZE;
  const offset = (page - 1) * limit;

  const enabled =
    scope === 'personal' ||
    (scope === 'company' && !!companyId) ||
    (scope === 'department' && !!departmentId) ||
    (scope === 'team' && !!teamId);

  const querySegment = variant === 'trash' ? 'trash' : 'archive';

  const buildListParams = useCallback(
    (listLimit: number, listOffset: number) => {
      const params = new URLSearchParams({
        scope,
        limit: String(listLimit),
        offset: String(listOffset),
        sortBy,
        sortOrder,
      });
      if (scope === 'company' && companyId) params.set('companyId', companyId);
      if (scope === 'department' && departmentId) params.set('departmentId', departmentId);
      if (scope === 'team' && teamId) params.set('teamId', teamId);
      if (typeFilter) params.set('type', typeFilter);
      return params;
    },
    [companyId, departmentId, scope, sortBy, sortOrder, teamId, typeFilter]
  );

  const fetchList = useCallback(
    async (listLimit: number, listOffset: number): Promise<ListResponse> => {
      const params = buildListParams(listLimit, listOffset);
      const apiUrl =
        variant === 'trash' ? `/api/v1/me/trash?${params}` : `/api/v1/me/archive?${params}`;
      const res = await apiFetch(apiUrl);
      if (!res.ok) throw new Error(`Failed to load ${querySegment}`);
      return (await res.json()) as ListResponse;
    },
    [buildListParams, querySegment, variant]
  );

  const scopeKey = [scope, companyId ?? '', departmentId ?? '', teamId ?? ''] as const;

  const wideQuery = useQuery({
    queryKey: [
      'me',
      querySegment,
      ...scopeKey,
      buildListParams(limit, offset).toString(),
    ],
    queryFn: () => fetchList(limit, offset),
    enabled: enabled && !compact,
  });

  const infiniteQuery = useInfiniteQuery({
    queryKey: [
      'me',
      querySegment,
      'infinite',
      ...scopeKey,
      sortBy,
      sortOrder,
      typeFilter,
      TRASH_ARCHIVE_COMPACT_PAGE_SIZE,
    ],
    queryFn: ({ pageParam }) => fetchList(TRASH_ARCHIVE_COMPACT_PAGE_SIZE, pageParam),
    initialPageParam: 0,
    getNextPageParam: (last) => {
      const nextOffset = last.offset + last.items.length;
      return nextOffset < last.total ? nextOffset : undefined;
    },
    enabled: enabled && compact,
  });

  const setFilter = useCallback(
    (key: string, value: string | null) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value == null || value === '') next.delete(key);
        else next.set(key, value);
        next.delete('page');
        return next;
      });
    },
    [setSearchParams]
  );

  const setSort = useCallback(
    (col: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        const order = sortBy === col && sortOrder === 'desc' ? 'asc' : 'desc';
        next.set('sortBy', col);
        next.set('sortOrder', order);
        next.delete('page');
        return next;
      });
    },
    [setSearchParams, sortBy, sortOrder]
  );

  const setPage = useCallback(
    (p: number) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (p <= 1) next.delete('page');
        else next.set('page', String(p));
        return next;
      });
    },
    [setSearchParams]
  );

  const setPageSize = useCallback(
    (value: number) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set(limitParamKey, String(value));
        next.delete('page');
        return next;
      });
    },
    [setSearchParams, limitParamKey]
  );

  const invalidateAfterMutation = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['me', 'trash'] });
    void queryClient.invalidateQueries({ queryKey: ['me', 'archive'] });
    void queryClient.invalidateQueries({ queryKey: ['me', 'personal-documents'] });
    void queryClient.invalidateQueries({ queryKey: ['me', 'drafts'] });
    void queryClient.invalidateQueries({ queryKey: ['catalog-documents'] });
    void queryClient.invalidateQueries({ queryKey: ['contexts'] });
    void queryClient.invalidateQueries({ queryKey: ['processes'] });
    void queryClient.invalidateQueries({ queryKey: ['projects'] });
  }, [queryClient]);

  const handleRestore = async (item: TrashArchiveItem) => {
    let res: Response;
    if (item.type === 'document') {
      res = await apiFetch(`/api/v1/documents/${item.id}/restore`, { method: 'POST' });
    } else if (item.type === 'process') {
      res = await apiFetch(`/api/v1/processes/${item.id}/restore`, { method: 'POST' });
    } else {
      res = await apiFetch(`/api/v1/projects/${item.id}/restore`, { method: 'POST' });
    }
    if (res.status === 204) {
      invalidateAfterMutation();
      notifications.show({
        title: t('documents:trashArchive.toasts.restoredTitle'),
        message: t('documents:trashArchive.toasts.restoredMessage'),
        color: 'green',
      });
    } else {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      notifications.show({
        title: t('documents:trashArchive.toasts.errorTitle'),
        message: body?.error ?? res.statusText,
        color: 'red',
      });
    }
  };

  const handleUnarchive = async (item: TrashArchiveItem) => {
    let res: Response;
    if (item.type === 'document') {
      res = await apiFetch(`/api/v1/documents/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archivedAt: null }),
      });
    } else if (item.type === 'process') {
      res = await apiFetch(`/api/v1/processes/${item.id}/unarchive`, { method: 'POST' });
    } else {
      res = await apiFetch(`/api/v1/projects/${item.id}/unarchive`, { method: 'POST' });
    }
    if (res.ok || res.status === 204) {
      invalidateAfterMutation();
      notifications.show({
        title: t('documents:trashArchive.toasts.unarchivedTitle'),
        message: t('documents:trashArchive.toasts.unarchivedMessage'),
        color: 'green',
      });
    } else {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      notifications.show({
        title: t('documents:trashArchive.toasts.errorTitle'),
        message: body?.error ?? res.statusText,
        color: 'red',
      });
    }
  };

  const rawItems = compact
    ? (infiniteQuery.data?.pages.flatMap((p) => p.items) ?? [])
    : (wideQuery.data?.items ?? []);
  const total = compact
    ? (infiniteQuery.data?.pages[0]?.total ?? 0)
    : (wideQuery.data?.total ?? 0);
  const totalPages = Math.ceil(total / limit) || 1;
  const isPending = compact ? infiniteQuery.isPending : wideQuery.isPending;
  const hasMore = compact ? !!infiniteQuery.hasNextPage : false;
  const loadingMore = compact ? infiniteQuery.isFetchingNextPage : false;
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = infiniteQuery;

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const sortedItems = useMemo(() => {
    const list = [...rawItems];
    if (sortBy === 'type') {
      return list.sort((a, b) => {
        const c = (a.type ?? '').localeCompare(b.type ?? '');
        return sortOrder === 'asc' ? c : -c;
      });
    }
    if (sortBy === 'contextName') {
      return list.sort((a, b) => {
        const va = (a.contextName ?? '').toLowerCase();
        const vb = (b.contextName ?? '').toLowerCase();
        const c = va.localeCompare(vb);
        return sortOrder === 'asc' ? c : -c;
      });
    }
    return list;
  }, [rawItems, sortBy, sortOrder]);

  const searchLower = localSearch.trim().toLowerCase();
  const filteredItems = useMemo(
    () =>
      searchLower
        ? sortedItems.filter(
            (item) =>
              (item.displayTitle ?? '').toLowerCase().includes(searchLower) ||
              (item.contextName ?? '').toLowerCase().includes(searchLower)
          )
        : sortedItems,
    [sortedItems, searchLower]
  );

  const isTrash = variant === 'trash';
  const loadingLabel = t(
    isTrash ? 'documents:trashArchive.loadingTrash' : 'documents:trashArchive.loadingArchive'
  );
  const emptyAllLabel = t(
    isTrash ? 'documents:trashArchive.emptyAllTrash' : 'documents:trashArchive.emptyAllArchive'
  );
  const dateColumnLabel = t(
    isTrash ? 'documents:trashArchive.dateColumnTrash' : 'documents:trashArchive.dateColumnArchive'
  );

  const dateValue = (item: TrashArchiveItem) =>
    variant === 'trash' ? item.deletedAt : item.archivedAt;

  return {
    searchParamKey,
    typeFilter,
    localSearch,
    sortBy,
    sortOrder,
    page,
    limit,
    dateSortColumn,
    isPending,
    total,
    totalPages,
    sortedItems,
    filteredItems,
    isTrash,
    loadingLabel,
    emptyAllLabel,
    dateColumnLabel,
    dateValue,
    hasMore,
    loadingMore,
    loadMore,
    setFilter,
    setSort,
    setPage,
    setPageSize,
    handleRestore,
    handleUnarchive,
  };
}
