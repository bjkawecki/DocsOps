import type { BlockDocument, BlockNode } from './blockSchema.js';
import {
  CALLOUT_VARIANT_TO_GFM,
  isAllowedLinkHref,
  readCalloutVariant,
  readImageAttachmentId,
  readImageCaption,
  readTextNodeLinkHref,
} from './blockSchema.js';
import { attachmentHrefToken, formatFigureCaption } from './figureCaption.js';
import { stripSuggestionsForPublished } from '../collaboration/draftInlineSuggestions.js';
import { tableBlockToMarkdown } from './markdownTable.js';

type MarkdownExportContext = {
  figureIndex: number;
};

function textFromMeta(node: BlockNode): string {
  const t = node.meta?.text;
  return typeof t === 'string' ? t : '';
}

function formatInlineTextNode(node: BlockNode): string {
  const text = textFromMeta(node);
  if (node.type !== 'text') return text;
  const rawMarks = node.meta?.marks;
  const marks = new Set(
    Array.isArray(rawMarks)
      ? rawMarks.filter((m): m is string => m === 'bold' || m === 'italic' || m === 'code')
      : []
  );
  let out = text;
  if (marks.has('code')) out = `\`${out}\``;
  if (marks.has('bold')) out = `**${out}**`;
  if (marks.has('italic')) out = `*${out}*`;
  const href = readTextNodeLinkHref(node.meta);
  if (href != null && isAllowedLinkHref(href)) {
    out = `[${out}](${href})`;
  }
  return out;
}

/** Flachtet Kindknoten zu einem String (für heading/paragraph/code-Inhalt). */
function innerText(node: BlockNode): string {
  if (node.type === 'text') return formatInlineTextNode(node);
  return (node.content ?? []).map(innerText).join('');
}

function blockquotePrefixedChildren(node: BlockNode, ctx: MarkdownExportContext): string {
  return (node.content ?? [])
    .map((child) =>
      blockNodeToMarkdown(child, ctx)
        .split('\n')
        .map((line) => (line.length > 0 ? `> ${line}` : '>'))
        .join('\n')
    )
    .filter((s) => s.length > 0)
    .join('\n>\n');
}

/**
 * Block-Dokument v0 → Markdown (EPIC-2 / PR-2b).
 * Spiegelbild zu {@link markdownToBlockDocumentV0}; für Export/Pandoc-Pipeline.
 */
export function blockDocumentV0ToMarkdown(doc: BlockDocument): string {
  const materialized = stripSuggestionsForPublished(doc);
  const ctx: MarkdownExportContext = { figureIndex: 0 };
  return materialized.blocks
    .map((block) => blockNodeToMarkdown(block, ctx))
    .filter((s) => s.length > 0)
    .join('\n\n');
}

function blockNodeToMarkdown(node: BlockNode, ctx: MarkdownExportContext): string {
  switch (node.type) {
    case 'text':
      return textFromMeta(node);
    case 'heading': {
      const raw = node.attrs?.level;
      const level =
        typeof raw === 'number' && Number.isFinite(raw)
          ? Math.min(6, Math.max(1, Math.trunc(raw)))
          : 1;
      return `${'#'.repeat(level)} ${innerText(node)}`.trimEnd();
    }
    case 'paragraph':
      return innerText(node);
    case 'code': {
      const lang = typeof node.attrs?.lang === 'string' ? node.attrs.lang : '';
      const body = innerText(node);
      return `\`\`\`${lang}\n${body}\n\`\`\``;
    }
    case 'mermaid': {
      const body = innerText(node);
      return `\`\`\`mermaid\n${body}\n\`\`\``;
    }
    case 'list_item':
      return innerText(node);
    case 'bullet_list':
      return (node.content ?? [])
        .map((item) => {
          const line = blockNodeToMarkdown(item, ctx);
          return `- ${line.replace(/\n/g, '\n  ')}`;
        })
        .join('\n');
    case 'ordered_list':
      return (node.content ?? [])
        .map((item, index) => {
          const line = blockNodeToMarkdown(item, ctx);
          return `${index + 1}. ${line.replace(/\n/g, '\n   ')}`;
        })
        .join('\n');
    case 'blockquote':
      return blockquotePrefixedChildren(node, ctx);
    case 'callout': {
      const variant = readCalloutVariant(node.attrs);
      if (variant == null) return blockquotePrefixedChildren(node, ctx);
      const tag = CALLOUT_VARIANT_TO_GFM[variant];
      const body = blockquotePrefixedChildren(node, ctx);
      return body.length > 0 ? `> [!${tag}]\n${body}` : `> [!${tag}]`;
    }
    case 'horizontal_rule':
      return '---';
    case 'table':
      return tableBlockToMarkdown(node, innerText);
    case 'table_row':
    case 'table_cell':
    case 'table_header':
      return innerText(node);
    case 'image': {
      const attachmentId = readImageAttachmentId(node.attrs);
      if (attachmentId == null) return '';
      ctx.figureIndex += 1;
      const label = formatFigureCaption(ctx.figureIndex, readImageCaption(node.attrs));
      return `![${label}](${attachmentHrefToken(attachmentId)})`;
    }
    default:
      return innerText(node);
  }
}
