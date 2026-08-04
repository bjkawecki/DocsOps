import { Title } from '@mantine/core';

/** Stable DOM id for the metadata document title H1 (TOC / deep links). */
export const DOCUMENT_TITLE_ANCHOR_ID = 'document-title';

type Props = {
  title: string;
};

/**
 * Document title from metadata – rendered as reading H1, not stored in block JSON.
 * Must sit inside `.document-content` so DocumentContent.css heading scale applies.
 */
export function DocumentReadingTitle({ title }: Props) {
  const label = title.trim();
  return (
    <Title order={1} id={DOCUMENT_TITLE_ANCHOR_ID}>
      {label.length > 0 ? label : '(Untitled)'}
    </Title>
  );
}
