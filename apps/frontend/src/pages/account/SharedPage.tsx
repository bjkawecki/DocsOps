import { Box, Container, Flex, Paper, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiFetch } from '../../api/client';
import { useRegisterScopePageChrome } from '../../components/appShell/scopeBreadcrumbs.js';
import {
  ContextDocumentsTable,
  readDocsListLimit,
  readDocsListPage,
  type ContextDocumentsTableRow,
} from '../../components/contexts/ContextDocumentsTable';
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

/** Shared inbox: left scope/doc nav + documents table (same chrome as context workspace). */
export function SharedPage() {
  useRegisterScopePageChrome(SHARED_SCOPE);
  const [searchParams] = useSearchParams();
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
      return (await res.json()) as { items: SharedDocItem[]; total: number };
    },
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

  const documents: ContextDocumentsTableRow[] = useMemo(
    () =>
      (sharedDocsRes?.items ?? []).map((d) => ({
        id: d.id,
        title: d.title?.trim() || 'Untitled',
        updatedAt: d.updatedAt,
        documentTags: d.documentTags ?? [],
      })),
    [sharedDocsRes?.items]
  );

  const sidebarDrafts = useMemo(
    () =>
      (draftsData?.draftDocuments ?? []).map((d) => ({
        id: d.id,
        title: d.title?.trim() || 'Untitled',
      })),
    [draftsData?.draftDocuments]
  );

  return (
    <Container fluid maw={1600} px="md" mb="xl">
      <Paper withBorder={false} p={0} radius="md">
        <Flex
          direction={{ base: 'column', lg: 'row' }}
          gap={{ base: 'md', lg: 'lg' }}
          align="flex-start"
        >
          <SharedScopeSidebar documents={sidebarDocs} drafts={sidebarDrafts} />

          <Box style={{ flex: 1, minWidth: 0, width: '100%' }}>
            {docsPending ? (
              <Text size="sm" c="dimmed">
                Loading documents…
              </Text>
            ) : (
              <ContextDocumentsTable
                documents={documents}
                total={sharedDocsRes?.total ?? 0}
                emptyMessage="No documents shared with you yet."
              />
            )}
          </Box>
        </Flex>
      </Paper>
    </Container>
  );
}
