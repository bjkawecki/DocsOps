import { Stack, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
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

function moreDocumentsLabel(contextType: DocumentContextDocsNavProps['contextType']): string {
  if (contextType === 'process') return 'More process documents';
  if (contextType === 'project' || contextType === 'subcontext') {
    return 'More project documents';
  }
  return 'More documents';
}

/** Sibling documents in the same context (collapsible list under meta). */
export function DocumentContextDocsNav({
  contextId,
  currentDocumentId,
  contextType,
}: DocumentContextDocsNavProps) {
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

  const title = moreDocumentsLabel(contextType);

  if (isPending && data == null) {
    return (
      <Text size="xs" c="dimmed">
        Loading documents…
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
            {doc.title.trim() || 'Untitled'}
          </Link>
        ))}
      </Stack>
    </DocumentChromeCollapsiblePanel>
  );
}
