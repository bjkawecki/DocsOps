import { Box, Container, Paper, Text } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { apiFetch } from '../../api/client';
import { useRegisterScopePageChrome } from '../../components/appShell/scopeBreadcrumbs.js';
import { WIDE_MIN_WIDTH } from '../../components/appShell/appShellLayoutConstants.js';
import {
  ContextDocumentsTable,
  DOCS_COMPACT_PAGE_SIZE,
  readDocsListLimit,
  readDocsListPage,
  type ContextDocumentsTableRow,
} from '../../components/contexts/ContextDocumentsTable';
import { PageMobileActionsHost } from '../../components/ui/pageMobileNav.js';
import { ResponsiveContentNav } from '../../components/ui/ResponsiveContentNav.js';
import { useMeDrafts } from '../../hooks/useMeDrafts';
import { SharedScopeSidebar, type SharedSidebarDoc } from './SharedScopeSidebar.js';

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

const SHARED_SCOPE = { type: 'shared' as const };

function scopeLabelForDoc(doc: SharedDocItem): { scopeKey: string; scopeLabel: string } {
  const owner = doc.context?.ownerDisplayName?.trim();
  const contextName = doc.context?.displayName?.trim();
  if (owner && contextName) {
    return {
      scopeKey: `${owner}::${doc.contextId ?? 'none'}`,
      scopeLabel: `${owner} · ${contextName}`,
    };
  }
  if (owner) {
    return { scopeKey: owner, scopeLabel: owner };
  }
  if (contextName && doc.contextId) {
    return { scopeKey: doc.contextId, scopeLabel: contextName };
  }
  return { scopeKey: 'unknown', scopeLabel: 'Other' };
}

function mapSharedDocToTableRow(d: SharedDocItem): ContextDocumentsTableRow {
  return {
    id: d.id,
    title: d.title?.trim() || 'Untitled',
    updatedAt: d.updatedAt,
    documentTags: d.documentTags ?? [],
  };
}

/** Shared inbox: left scope/doc nav + documents table (same chrome as context workspace). */
export function SharedPage() {
  const { t } = useTranslation('shell');
  useRegisterScopePageChrome(SHARED_SCOPE);
  const [searchParams] = useSearchParams();
  const isWideViewport = useMediaQuery(WIDE_MIN_WIDTH) ?? true;
  const compactNavOpenRef = useRef<(() => void) | null>(null);
  const navTitle = t('nav.shared');

  const docsPage = readDocsListPage(searchParams);
  const docsLimit = readDocsListLimit(searchParams);
  const docsOffset = (docsPage - 1) * docsLimit;

  const { data: sidebarDocsRes } = useQuery({
    queryKey: ['me', 'shared-documents', 'sidebar'],
    queryFn: async () => {
      const res = await apiFetch('/api/v1/me/shared-documents?limit=100&offset=0');
      if (!res.ok) throw new Error('Failed to load shared documents');
      return (await res.json()) as { items: SharedDocItem[]; total: number };
    },
  });

  const { data: sharedDocsRes, isPending: docsPending } = useQuery({
    queryKey: ['me', 'shared-documents', docsLimit, docsOffset],
    queryFn: async () => {
      const res = await apiFetch(
        `/api/v1/me/shared-documents?limit=${docsLimit}&offset=${docsOffset}`
      );
      if (!res.ok) throw new Error('Failed to load shared documents');
      return (await res.json()) as SharedDocsPage;
    },
    enabled: isWideViewport,
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
    enabled: !isWideViewport,
  });

  const { data: draftsData } = useMeDrafts({ scope: 'shared' }, { limit: 20 });

  const sidebarDocs: SharedSidebarDoc[] = useMemo(
    () =>
      (sidebarDocsRes?.items ?? []).map((d) => {
        const { scopeKey, scopeLabel } = scopeLabelForDoc(d);
        return {
          id: d.id,
          title: d.title?.trim() || 'Untitled',
          scopeKey,
          scopeLabel,
        };
      }),
    [sidebarDocsRes?.items]
  );

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

  const sidebarDrafts = useMemo(
    () =>
      (draftsData?.draftDocuments ?? []).map((d) => ({
        id: d.id,
        title: d.title?.trim() || 'Untitled',
      })),
    [draftsData?.draftDocuments]
  );

  const docsLoading = isWideViewport ? docsPending : docsInfinitePending;

  return (
    <Container fluid maw={1600} px="md" mb="xl">
      <Paper withBorder={false} p={0} radius="md">
        <PageMobileActionsHost navTitle={navTitle} compactNavOpenRef={compactNavOpenRef}>
          <ResponsiveContentNav
            title={navTitle}
            compactNavOpenRef={isWideViewport ? undefined : compactNavOpenRef}
            nav={<SharedScopeSidebar documents={sidebarDocs} drafts={sidebarDrafts} />}
          >
            <Box style={{ flex: 1, minWidth: 0, width: '100%' }}>
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
            </Box>
          </ResponsiveContentNav>
        </PageMobileActionsHost>
      </Paper>
    </Container>
  );
}
