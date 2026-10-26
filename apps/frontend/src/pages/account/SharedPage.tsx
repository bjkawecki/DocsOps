import { Text } from '@mantine/core';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useSearchParams } from 'react-router-dom';
import { IconShare } from '@tabler/icons-react';
import { apiFetch } from '../../api/client';
import {
  ContextDocumentsTable,
  DOCS_COMPACT_PAGE_SIZE,
  readDocsListLimit,
  readDocsListPage,
  type ContextDocumentsTableRow,
} from '../../components/contexts/ContextDocumentsTable';
import { useMe } from '../../hooks/useMe';
import { PersonalAreaPageChrome } from './PersonalAreaPageChrome.js';
import { useWideLayout } from '../../components/appShell/useWideLayout.js';

type SharedDocItem = {
  id: string;
  title: string;
  contextId: string | null;
  createdAt: string;
  updatedAt: string;
  documentTags?: { tag: { id: string; name: string } }[];
  context?: {
    id: string;
    displayName: string | null;
    contextType: string | null;
    ownerDisplayName: string | null;
  } | null;
};

type SharedDocsPage = {
  items: SharedDocItem[];
  total: number;
  limit: number;
  offset: number;
};

function mapSharedDocToTableRow(d: SharedDocItem): ContextDocumentsTableRow {
  return {
    id: d.id,
    title: d.title?.trim() || 'Untitled',
    updatedAt: d.updatedAt,
    documentTags: d.documentTags ?? [],
  };
}

/** Shared documents inbox inside the personal area shell. */
export function SharedPage() {
  const { t } = useTranslation('shell');
  const { data: me } = useMe();
  const [searchParams] = useSearchParams();
  const isWideViewport = useWideLayout();
  const isPlatformAdmin = me?.user?.isAdmin === true;

  const docsPage = readDocsListPage(searchParams);
  const docsLimit = readDocsListLimit(searchParams);
  const docsOffset = (docsPage - 1) * docsLimit;

  const { data: sharedDocsRes, isPending: docsPending } = useQuery({
    queryKey: ['me', 'shared-documents', docsLimit, docsOffset],
    queryFn: async () => {
      const res = await apiFetch(
        `/api/v1/me/shared-documents?limit=${docsLimit}&offset=${docsOffset}`
      );
      if (!res.ok) throw new Error('Failed to load shared documents');
      return (await res.json()) as SharedDocsPage;
    },
    enabled: isWideViewport && !isPlatformAdmin,
  });

  const {
    data: sharedDocsInfinite,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending: docsInfinitePending,
  } = useInfiniteQuery({
    queryKey: ['me', 'shared-documents', 'infinite', DOCS_COMPACT_PAGE_SIZE],
    queryFn: async ({ pageParam }) => {
      const offset = pageParam;
      const res = await apiFetch(
        `/api/v1/me/shared-documents?limit=${DOCS_COMPACT_PAGE_SIZE}&offset=${offset}`
      );
      if (!res.ok) throw new Error('Failed to load shared documents');
      return (await res.json()) as SharedDocsPage;
    },
    initialPageParam: 0,
    getNextPageParam: (last) => {
      const nextOffset = last.offset + last.items.length;
      return nextOffset < last.total ? nextOffset : undefined;
    },
    enabled: !isWideViewport && !isPlatformAdmin,
  });

  const documents: ContextDocumentsTableRow[] = useMemo(() => {
    const items = isWideViewport
      ? (sharedDocsRes?.items ?? [])
      : (sharedDocsInfinite?.pages.flatMap((p) => p.items) ?? []);
    return items.map(mapSharedDocToTableRow);
  }, [isWideViewport, sharedDocsInfinite?.pages, sharedDocsRes?.items]);

  const sharedDocsTotal = isWideViewport
    ? (sharedDocsRes?.total ?? 0)
    : (sharedDocsInfinite?.pages[0]?.total ?? 0);

  const loadMoreDocuments = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const docsLoading = isWideViewport ? docsPending : docsInfinitePending;

  if (isPlatformAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <PersonalAreaPageChrome
      trailSuffix={[
        {
          key: 'shared',
          label: t('nav.shared'),
          icon: <IconShare size={14} stroke={1.5} />,
        },
      ]}
      sharedCount={sharedDocsTotal}
    >
      {docsLoading ? (
        <Text size="sm" c="dimmed">
          Loading documents…
        </Text>
      ) : (
        <ContextDocumentsTable
          documents={documents}
          total={sharedDocsTotal}
          hasMore={!isWideViewport && !!hasNextPage}
          onLoadMore={loadMoreDocuments}
          loadingMore={isFetchingNextPage}
          emptyMessage="No documents shared with you yet."
        />
      )}
    </PersonalAreaPageChrome>
  );
}
