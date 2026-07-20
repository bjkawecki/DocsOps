import { Badge, Group, Text } from '@mantine/core';
import type { ReactNode } from 'react';
import type { DocumentResponse } from './documentPageTypes';

export function buildDocumentMetadataItems(params: { data: DocumentResponse }): ReactNode[] {
  const { data } = params;
  const writerNames = [
    ...(data.writers?.users?.map((u) => u.name) ?? []),
    ...(data.writers?.teams?.map((t) => t.name) ?? []),
    ...(data.writers?.departments?.map((d) => d.name) ?? []),
  ].filter(Boolean);

  const metadataItems: ReactNode[] = [];
  if (data.publishedAt) {
    const versionSuffix =
      data.currentPublishedVersionNumber != null ? ` · v${data.currentPublishedVersionNumber}` : '';
    metadataItems.push(
      <Group key="status" gap="xs" align="center">
        <Badge size="sm" variant="filled" color="green">
          Published{versionSuffix}
        </Badge>
        <Text size="sm" c="dimmed" span>
          {new Date(data.publishedAt).toLocaleDateString(undefined)}
        </Text>
      </Group>
    );
  } else {
    metadataItems.push(
      <Badge key="status" size="sm" variant="filled" color="yellow">
        Draft
      </Badge>
    );
  }
  if (data.createdByName) {
    metadataItems.push(
      <Group key="author" gap="xs" align="center">
        <Text size="sm" c="dimmed" span>
          Created by:{' '}
        </Text>
        <Badge size="sm" variant="filled">
          {data.createdByName}
        </Badge>
      </Group>
    );
  }
  if (writerNames.length > 0) {
    metadataItems.push(
      <Group key="writers" gap="xs" align="center">
        <Text size="sm" c="dimmed" span>
          Writers:{' '}
        </Text>
        <Badge size="sm" variant="filled">
          {writerNames.join(', ')}
        </Badge>
      </Group>
    );
  }
  if (data.documentTags.length > 0) {
    data.documentTags.forEach((dt) => {
      metadataItems.push(
        <Badge key={`tag-${dt.tag.id}`} size="sm" variant="light" color="gray">
          {dt.tag.name}
        </Badge>
      );
    });
  }
  return metadataItems;
}
