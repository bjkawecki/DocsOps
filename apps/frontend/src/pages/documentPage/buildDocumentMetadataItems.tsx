import { Stack, Text } from '@mantine/core';
import type { DocumentResponse } from './documentPageTypes';

/**
 * Version/draft + tags for the document left column (under context, above TOC).
 * Two plain text lines – no badge chrome.
 */
export function DocumentSidebarMeta({ data }: { data: DocumentResponse }) {
  const versionNumber = data.currentPublishedVersionNumber;
  const tagNames = data.documentTags.map((dt) => dt.tag.name).filter(Boolean);
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

  return (
    <Stack gap={4} w="100%">
      {statusLine != null ? (
        <Text size="sm" c="dimmed">
          {statusLine}
        </Text>
      ) : null}
      {tagNames.length > 0 ? (
        <Text size="sm" c="dimmed" aria-label="Tags">
          Tags: {tagNames.join(', ')}
        </Text>
      ) : null}
    </Stack>
  );
}
