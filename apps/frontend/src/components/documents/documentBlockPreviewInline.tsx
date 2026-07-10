import { Code, Text } from '@mantine/core';
import { Fragment, type ReactNode } from 'react';
import type { BlockNodeV0 } from '../../api/document-types';

type InlineMark = 'bold' | 'italic' | 'code';

function readInlineMarks(meta: Record<string, unknown> | undefined): InlineMark[] {
  const raw = meta?.marks;
  if (!Array.isArray(raw)) return [];
  return raw.filter((m): m is InlineMark => m === 'bold' || m === 'italic' || m === 'code');
}

function renderTextLeaf(leaf: BlockNodeV0): ReactNode {
  const text = leaf.meta?.text;
  if (typeof text !== 'string' || text.length === 0) return null;

  const marks = readInlineMarks(leaf.meta);
  if (marks.length === 0) {
    return <Fragment key={leaf.id}>{text}</Fragment>;
  }

  let node: ReactNode = text;
  if (marks.includes('code')) {
    node = (
      <Code key={`${leaf.id}-code`} style={{ display: 'inline' }}>
        {node}
      </Code>
    );
  }
  if (marks.includes('italic')) {
    node = (
      <Text key={`${leaf.id}-italic`} component="em" span inherit fs="inherit">
        {node}
      </Text>
    );
  }
  if (marks.includes('bold')) {
    node = (
      <Text key={`${leaf.id}-bold`} component="strong" span inherit fs="inherit" fw={700}>
        {node}
      </Text>
    );
  }

  return <Fragment key={leaf.id}>{node}</Fragment>;
}

/** Render paragraph/heading inline leaves including bold/italic/code marks. */
export function renderInlineBlockContent(content: BlockNodeV0[] | undefined): ReactNode {
  if (!content?.length) return null;
  const parts = content
    .filter((node) => node.type === 'text')
    .map((leaf) => renderTextLeaf(leaf))
    .filter(Boolean);
  if (parts.length === 0) return null;
  return parts;
}
