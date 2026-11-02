import { Stack, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../api/client.js';
import { DocumentChromeCollapsiblePanel } from './DocumentChromeCollapsiblePanel.js';

type PersonalDocItem = {
  id: string;
  title: string;
  contextId: string | null;
};

type Props = {
  currentDocumentId: string;
};

/** Sibling context-free personal documents (same chrome slot as DocumentContextDocsNav). */
export function DocumentPersonalUngroupedDocsNav({ currentDocumentId }: Props) {
  const { t } = useTranslation(['documents', 'common']);
  const { data, isPending, isError } = useQuery({
    queryKey: ['me', 'personal-documents', 'doc-sidebar'],
    queryFn: async () => {
      const res = await apiFetch('/api/v1/me/personal-documents?limit=100&offset=0');
      if (!res.ok) throw new Error('Failed to load personal documents');
      return res.json() as Promise<{ items: PersonalDocItem[]; total: number }>;
    },
  });

  const others = useMemo(
    () => (data?.items ?? []).filter((d) => d.contextId == null && d.id !== currentDocumentId),
    [data?.items, currentDocumentId]
  );

  const title = t('sidebar.moreUngroupedDocuments');

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
      sectionId="doc-page:more-docs:personal-ungrouped"
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
