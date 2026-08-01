import { Badge, Group, Stack, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../api/client.js';
import type { DocumentTypeDto } from '../../components/documents/documentTypeTypes.js';
import type { DocumentResponse } from './documentPageTypes';
import { DocumentChromeCollapsiblePanel } from './DocumentChromeCollapsiblePanel.js';

function useDocumentTypeLabel(
  documentTypeKey: string | null | undefined,
  contextId: string | null
): string | null {
  const { data } = useQuery({
    queryKey: ['document-types', contextId, 'sidebar-label', documentTypeKey],
    queryFn: async (): Promise<DocumentTypeDto[]> => {
      const params = new URLSearchParams();
      if (contextId) params.set('contextId', contextId);
      const res = await apiFetch(`/api/v1/document-types?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load document types');
      return ((await res.json()) as { items: DocumentTypeDto[] }).items;
    },
    enabled: documentTypeKey != null && documentTypeKey.length > 0,
  });

  if (!documentTypeKey) return null;
  const match = data?.find(
    (t) => t.documentTypeKey === documentTypeKey || t.id === documentTypeKey
  );
  if (match?.label) return match.label;
  if (documentTypeKey.startsWith('builtin:')) {
    return documentTypeKey
      .slice('builtin:'.length)
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
  return null;
}

/**
 * Version/draft + type + tags + description for the document left column (under TOC).
 */
export function DocumentSidebarMeta({ data }: { data: DocumentResponse }) {
  const versionNumber = data.currentPublishedVersionNumber;
  const tags = data.documentTags.filter((dt) => dt.tag.name.trim().length > 0);
  const description = data.description?.trim() || null;
  const typeLabel = useDocumentTypeLabel(data.documentTypeKey, data.contextId);
  const dateLabel = data.publishedAt
    ? new Date(data.publishedAt).toLocaleDateString(undefined)
    : null;

  let statusLine: string | null = null;
  if (data.publishedAt) {
    const versionPart = versionNumber != null ? `Version ${versionNumber}` : null;
    if (versionPart != null && dateLabel != null) {
      statusLine = `${versionPart}, ${dateLabel}`;
    } else {
      statusLine = versionPart ?? dateLabel;
    }
  } else {
    statusLine = 'Draft';
  }

  const hasType =
    typeLabel != null || (data.documentTypeKey != null && data.documentTypeKey.length > 0);
  const hasContent = statusLine != null || hasType || tags.length > 0 || description != null;
  if (!hasContent) return null;

  return (
    <DocumentChromeCollapsiblePanel
      sectionId="doc-page:details"
      title="Details"
      defaultOpen={false}
    >
      <Stack gap="sm" w="100%" px={4}>
        {statusLine != null ? (
          <Text size="sm" c="dimmed">
            {statusLine}
          </Text>
        ) : null}
        {hasType ? (
          <Text size="sm">
            <Text span c="dimmed">
              Type:{' '}
            </Text>
            {typeLabel ?? data.documentTypeKey}
          </Text>
        ) : null}
        {tags.length > 0 ? (
          <Group gap={6} wrap="wrap" aria-label="Tags">
            {tags.map((dt) => (
              <Badge
                key={dt.tag.id}
                size="xs"
                variant="light"
                color="gray"
                radius="xl"
                tt="none"
                fw={500}
              >
                {dt.tag.name}
              </Badge>
            ))}
          </Group>
        ) : null}
        {description != null ? (
          <Text size="sm" c="dimmed" style={{ lineHeight: 1.4 }}>
            {description}
          </Text>
        ) : null}
      </Stack>
    </DocumentChromeCollapsiblePanel>
  );
}
