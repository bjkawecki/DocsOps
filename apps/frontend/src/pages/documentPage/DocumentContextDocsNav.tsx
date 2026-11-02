import { Stack, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../api/client.js';
import { DocumentChromeCollapsiblePanel } from './DocumentChromeCollapsiblePanel.js';

type ContextDocItem = {
  id: string;
  title: string;
};

type DocumentContextDocsNavProps = {
  contextId: string;
  currentDocumentId: string;
  contextType?: 'process' | 'project' | 'subcontext' | null;
};

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

function moreDocumentsLabel(
  contextType: DocumentContextDocsNavProps['contextType'],
  t: TranslateFn
): string {
  if (contextType === 'process') return t('sidebar.moreProcessDocuments');
  if (contextType === 'project' || contextType === 'subcontext') {
    return t('sidebar.moreProjectDocuments');
  }
  return t('sidebar.moreDocuments');
}

/** Sibling documents in the same context (collapsible list under meta). */
export function DocumentContextDocsNav({
  contextId,
  currentDocumentId,
  contextType,
}: DocumentContextDocsNavProps) {
  const { t } = useTranslation(['documents', 'common']);
  const { data, isPending, isError } = useQuery({
    queryKey: ['contexts', contextId, 'documents'],
    queryFn: async () => {
      const res = await apiFetch(`/api/v1/contexts/${contextId}/documents?limit=100&offset=0`);
      if (!res.ok) throw new Error('Failed to load context documents');
      return res.json() as Promise<{ items: ContextDocItem[]; total: number }>;
    },
  });

  const others = useMemo(
    () => (data?.items ?? []).filter((d) => d.id !== currentDocumentId),
    [data?.items, currentDocumentId]
  );

  const title = moreDocumentsLabel(contextType, t);

  if (isPending && data == null) {
    return (
      <Text size="xs" c="dimmed">
        {t('sidebar.loadingDocuments')}
      </Text>
    );
  }
  if (isError || others.length === 0) return null;

  return (
    <DocumentChromeCollapsiblePanel
      sectionId={`doc-page:more-docs:${contextId}`}
      title={title}
      defaultOpen
    >
      <Stack
        component="nav"
        gap={4}
        aria-label={title}
        style={{ maxHeight: 220, overflow: 'auto' }}
      >
        {others.map((doc) => (
          <Link key={doc.id} to={`/documents/${doc.id}`} className="document-chrome-nav-link">
            {doc.title.trim() || t('common:status.untitled')}
          </Link>
        ))}
      </Stack>
    </DocumentChromeCollapsiblePanel>
  );
}
