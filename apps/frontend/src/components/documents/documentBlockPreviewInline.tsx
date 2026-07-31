import { Anchor, Code, Text } from '@mantine/core';
import { IconExternalLink } from '@tabler/icons-react';
import { Fragment, type ReactNode } from 'react';
import type { BlockNodeV0 } from '../../api/document-types';
import { isAllowedLinkHref, readTextNodeLinkHref } from '../../lib/blockLinkHref.js';

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

  const href = readTextNodeLinkHref(leaf.meta);
  if (href != null && isAllowedLinkHref(href)) {
    const external = /^https?:\/\//i.test(href);
    node = (
      <Anchor
        key={`${leaf.id}-link`}
        href={href}
        {...(external
          ? { target: '_blank', rel: 'noopener noreferrer' }
          : { target: undefined, rel: undefined })}
        inherit
        style={{ display: 'inline' }}
      >
        {external ? (
          <IconExternalLink
            size={14}
            stroke={1.75}
            style={{
              display: 'inline-block',
              verticalAlign: '-0.15em',
              marginRight: 4,
            }}
            aria-hidden
          />
        ) : null}
        {node}
      </Anchor>
    );
  }

  return <Fragment key={leaf.id}>{node}</Fragment>;
}

/** Render paragraph/heading inline leaves including marks and links (ADR 005). */
export function renderInlineBlockContent(content: BlockNodeV0[] | undefined): ReactNode {
  if (!content?.length) return null;
  const parts = content
    .filter((node) => node.type === 'text')
    .map((leaf) => renderTextLeaf(leaf))
    .filter(Boolean);
  if (parts.length === 0) return null;
  return parts;
}
