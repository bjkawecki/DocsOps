import { Badge, Group, Stack, Text } from '@mantine/core';
import type { DocumentResponse } from './documentPageTypes';

/**
 * Version/draft + tags + description for the document left column (under context, above TOC).
 */
export function DocumentSidebarMeta({ data }: { data: DocumentResponse }) {
  const versionNumber = data.currentPublishedVersionNumber;
  const tags = data.documentTags.filter((dt) => dt.tag.name.trim().length > 0);
  const description = data.description?.trim() || null;
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
    <Stack gap={6} w="100%">
      {statusLine != null ? (
        <Text size="sm" c="dimmed">
          {statusLine}
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
  );
}
