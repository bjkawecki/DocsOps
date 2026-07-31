import type { JSONContent } from '@tiptap/core';
import type { BlockNodeV0 } from '../api/document-types';
import { isAllowedLinkHref, readTextNodeLinkHref } from './blockLinkHref.js';
import { randomId } from './randomId.js';
import { mergeAdjacentSuggestionLeaves } from './blockDocumentTiptapExportHelpers.js';
import { imageOurToTiptap, tiptapImageToOur } from './blockDocumentTiptapImage.js';
import { tableOurToTiptap, tiptapTableToOur } from './blockDocumentTiptapTable.js';
import { isCalloutVariant } from './calloutVariant.js';

/* TipTap ↔ blocks mapping grows with each block type; split further when adding the next type. */
/* eslint-disable max-lines */

export type TiptapConvertContext = {
  documentId?: string;
};

type InlineMark = 'bold' | 'italic' | 'code';

type BlockSuggestion = {
  id: string;
  kind: 'insert' | 'delete';
  authorId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  createdAt: string;
};

function newId(): string {
  return randomId();
}

function readMarks(meta: Record<string, unknown> | undefined): InlineMark[] {
  const raw = meta?.marks;
  if (!Array.isArray(raw)) return [];
  return raw.filter((m): m is InlineMark => m === 'bold' || m === 'italic' || m === 'code');
}

function readSuggestion(meta: Record<string, unknown> | undefined): BlockSuggestion | null {
  const raw = meta?.suggestion;
  if (!raw || typeof raw !== 'object') return null;
  const s = raw as Record<string, unknown>;
  if (
    typeof s.id !== 'string' ||
    (s.kind !== 'insert' && s.kind !== 'delete') ||
    typeof s.authorId !== 'string' ||
    typeof s.createdAt !== 'string' ||
    (s.status !== 'pending' &&
      s.status !== 'accepted' &&
      s.status !== 'rejected' &&
      s.status !== 'withdrawn')
  ) {
    return null;
  }
  return {
    id: s.id,
    kind: s.kind,
    authorId: s.authorId,
    status: s.status,
    createdAt: s.createdAt,
  };
}

export function textLeaf(
  text: string,
  marks?: InlineMark[],
  suggestion?: BlockSuggestion,
  linkHref?: string
): BlockNodeV0 {
  const meta: Record<string, unknown> = { text };
  if (marks?.length) meta.marks = marks;
  if (suggestion) meta.suggestion = suggestion;
  if (linkHref != null && linkHref.length > 0) meta.link = { href: linkHref };
  return {
    id: newId(),
    type: 'text',
    attrs: {},
    meta,
  };
}

/** Flachtet Kindknoten zu einem String (analog Backend `innerText`, ohne Markup). */
export function innerTextFromBlockNode(node: BlockNodeV0): string {
  if (node.type === 'text') {
    const t = node.meta?.text;
    return typeof t === 'string' ? t : '';
  }
  return (node.content ?? []).map(innerTextFromBlockNode).join('');
}

function pmInlineText(content: JSONContent[] | undefined): string {
  if (!content?.length) return '';
  let s = '';
  for (const c of content) {
    if (c.type === 'text' && typeof c.text === 'string') s += c.text;
    else if (c.type === 'hardBreak') s += '\n';
    else if (c.content?.length) s += pmInlineText(c.content);
  }
  return s;
}

function readBlockId(attrs: Record<string, unknown> | undefined): string {
  const raw = attrs?.blockId;
  return typeof raw === 'string' && raw.length > 0 ? raw : newId();
}

function pmInlineToTextLeaves(content: JSONContent[] | undefined): BlockNodeV0[] {
  const leaves: BlockNodeV0[] = [];
  for (const c of content ?? []) {
    if (c.type === 'text' && typeof c.text === 'string') {
      const marks: InlineMark[] = [];
      let suggestion: BlockSuggestion | undefined;
      let linkHref: string | undefined;
      for (const mark of c.marks ?? []) {
        if (mark.type === 'bold') marks.push('bold');
        if (mark.type === 'italic') marks.push('italic');
        if (mark.type === 'code') marks.push('code');
        if (mark.type === 'link') {
          const attrs = mark.attrs as { href?: unknown } | undefined;
          const href = attrs?.href;
          if (typeof href === 'string' && isAllowedLinkHref(href)) {
            linkHref = href;
          }
        }
        if (mark.type === 'suggestionInsert' || mark.type === 'suggestionDelete') {
          const attrs = mark.attrs as Record<string, unknown> | undefined;
          if (
            typeof attrs?.suggestionId === 'string' &&
            typeof attrs?.authorId === 'string' &&
            typeof attrs?.createdAt === 'string'
          ) {
            suggestion = {
              id: attrs.suggestionId,
              kind: mark.type === 'suggestionInsert' ? 'insert' : 'delete',
              authorId: attrs.authorId,
              status: 'pending',
              createdAt: attrs.createdAt,
            };
          }
        }
      }
      leaves.push(textLeaf(c.text, marks.length ? marks : undefined, suggestion, linkHref));
    } else if (c.type === 'hardBreak') {
      leaves.push(textLeaf('\n'));
    } else if (c.content?.length) {
      leaves.push(...pmInlineToTextLeaves(c.content));
    }
  }
  return mergeAdjacentSuggestionLeaves(leaves.length > 0 ? leaves : [textLeaf('')]);
}

function suggestionToPmMark(suggestion: BlockSuggestion): {
  type: string;
  attrs: Record<string, unknown>;
} {
  return {
    type: suggestion.kind === 'insert' ? 'suggestionInsert' : 'suggestionDelete',
    attrs: {
      suggestionId: suggestion.id,
      authorId: suggestion.authorId,
      createdAt: suggestion.createdAt,
    },
  };
}

function blockInlineContentToTiptap(content: BlockNodeV0[] | undefined): JSONContent[] {
  const out: JSONContent[] = [];
  for (const leaf of content ?? []) {
    if (leaf.type !== 'text') continue;
    const text = innerTextFromBlockNode(leaf);
    if (!text) continue;
    const marks = readMarks(leaf.meta);
    const suggestion = readSuggestion(leaf.meta);
    const linkHref = readTextNodeLinkHref(leaf.meta);
    const pmMarks: JSONContent['marks'] = marks.map((m) => ({ type: m }));
    if (linkHref != null && isAllowedLinkHref(linkHref)) {
      pmMarks.push({ type: 'link', attrs: { href: linkHref } });
    }
    if (suggestion?.status === 'pending') {
      pmMarks.push(suggestionToPmMark(suggestion));
    }
    out.push({ type: 'text', text, ...(pmMarks.length ? { marks: pmMarks } : {}) });
  }
  return out;
}

function paragraphOurToTiptap(p: BlockNodeV0): JSONContent {
  return {
    type: 'paragraph',
    attrs: { blockId: p.id },
    content: blockInlineContentToTiptap(p.content),
  };
}

function listItemOurToTiptap(item: BlockNodeV0): JSONContent {
  const paras = (item.content ?? []).filter((c) => c.type === 'paragraph');
  const content: JSONContent[] =
    paras.length > 0
      ? paras.map((p) => paragraphOurToTiptap(p))
      : [paragraphOurToTiptap({ id: newId(), type: 'paragraph', content: [textLeaf('')] })];
  return {
    type: 'listItem',
    attrs: { blockId: item.id },
    content,
  };
}

export function ourTopLevelBlockToTiptap(
  block: BlockNodeV0,
  ctx: TiptapConvertContext = {}
): JSONContent | null {
  switch (block.type) {
    case 'heading': {
      const raw = block.attrs?.level;
      const level =
        typeof raw === 'number' && Number.isFinite(raw)
          ? Math.min(6, Math.max(1, Math.trunc(raw)))
          : 1;
      return {
        type: 'heading',
        attrs: { level, blockId: block.id },
        content: blockInlineContentToTiptap(block.content),
      };
    }
    case 'paragraph':
      return paragraphOurToTiptap(block);
    case 'code': {
      const lang = typeof block.attrs?.lang === 'string' ? block.attrs.lang : '';
      const text = innerTextFromBlockNode(block);
      return {
        type: 'codeBlock',
        attrs: {
          language: lang.length > 0 ? lang : null,
          blockId: block.id,
        },
        content: text ? [{ type: 'text', text }] : [],
      };
    }
    case 'bullet_list': {
      const items = (block.content ?? []).filter((c) => c.type === 'list_item');
      return {
        type: 'bulletList',
        attrs: { blockId: block.id },
        content: items.map((item) => listItemOurToTiptap(item)),
      };
    }
    case 'ordered_list': {
      const items = (block.content ?? []).filter((c) => c.type === 'list_item');
      return {
        type: 'orderedList',
        attrs: { blockId: block.id },
        content: items.map((item) => listItemOurToTiptap(item)),
      };
    }
    case 'blockquote': {
      const inner = (block.content ?? [])
        .map((child) => ourTopLevelBlockToTiptap(child, ctx))
        .filter((n): n is JSONContent => n != null);
      return {
        type: 'blockquote',
        attrs: { blockId: block.id },
        content:
          inner.length > 0
            ? inner
            : [paragraphOurToTiptap({ id: newId(), type: 'paragraph', content: [textLeaf('')] })],
      };
    }
    case 'callout': {
      const rawVariant = block.attrs?.variant;
      const variant = isCalloutVariant(rawVariant) ? rawVariant : 'info';
      const inner = (block.content ?? [])
        .map((child) => ourTopLevelBlockToTiptap(child, ctx))
        .filter((n): n is JSONContent => n != null);
      return {
        type: 'callout',
        attrs: { blockId: block.id, variant },
        content:
          inner.length > 0
            ? inner
            : [paragraphOurToTiptap({ id: newId(), type: 'paragraph', content: [textLeaf('')] })],
      };
    }
    case 'horizontal_rule':
      return {
        type: 'horizontalRule',
        attrs: { blockId: block.id },
      };
    case 'image':
      return imageOurToTiptap(block, ctx.documentId);
    case 'table':
      return tableOurToTiptap(block, paragraphOurToTiptap, newId, textLeaf);
    default: {
      const text = innerTextFromBlockNode(block);
      if (!text) {
        return {
          type: 'paragraph',
          attrs: { blockId: block.id },
          content: [],
        };
      }
      return {
        type: 'paragraph',
        attrs: { blockId: block.id },
        content: blockInlineContentToTiptap(block.content) || [{ type: 'text', text }],
      };
    }
  }
}

function tiptapParagraphToOur(node: JSONContent): BlockNodeV0 {
  const id = readBlockId(node.attrs);
  const leaves = pmInlineToTextLeaves(node.content);
  return {
    id,
    type: 'paragraph',
    content: leaves,
  };
}

function tiptapListItemToOur(node: JSONContent): BlockNodeV0 {
  const id = readBlockId(node.attrs);
  const inner = (node.content ?? []).map((c) => {
    if (c.type === 'paragraph') return tiptapParagraphToOur(c);
    return {
      id: newId(),
      type: 'paragraph',
      content: pmInlineToTextLeaves(c.content),
    };
  });
  return {
    id,
    type: 'list_item',
    content:
      inner.length > 0 ? inner : [{ id: newId(), type: 'paragraph', content: [textLeaf('')] }],
  };
}

export function tiptapTopLevelToOur(node: JSONContent): BlockNodeV0 | null {
  switch (node.type) {
    case 'heading': {
      const attrs = node.attrs as Record<string, unknown> | undefined;
      const id = readBlockId(attrs);
      const raw = attrs?.level;
      const level =
        typeof raw === 'number' && Number.isFinite(raw)
          ? Math.min(6, Math.max(1, Math.trunc(raw)))
          : 1;
      return {
        id,
        type: 'heading',
        attrs: { level },
        content: pmInlineToTextLeaves(node.content),
      };
    }
    case 'paragraph':
      return tiptapParagraphToOur(node);
    case 'codeBlock': {
      const attrs = node.attrs as Record<string, unknown> | undefined;
      const id = readBlockId(attrs);
      const langRaw = attrs?.language;
      const lang = typeof langRaw === 'string' && langRaw.length > 0 ? langRaw : '';
      const t = pmInlineText(node.content);
      return {
        id,
        type: 'code',
        attrs: lang ? { lang } : {},
        content: [textLeaf(t)],
      };
    }
    case 'bulletList': {
      const id = readBlockId(node.attrs);
      const items = (node.content ?? [])
        .filter((c) => c.type === 'listItem')
        .map((c) => tiptapListItemToOur(c));
      return { id, type: 'bullet_list', content: items };
    }
    case 'orderedList': {
      const id = readBlockId(node.attrs);
      const items = (node.content ?? [])
        .filter((c) => c.type === 'listItem')
        .map((c) => tiptapListItemToOur(c));
      return { id, type: 'ordered_list', content: items };
    }
    case 'blockquote': {
      const id = readBlockId(node.attrs);
      const inner = (node.content ?? [])
        .map((c) => tiptapTopLevelToOur(c))
        .filter((b): b is BlockNodeV0 => b != null);
      return {
        id,
        type: 'blockquote',
        content:
          inner.length > 0 ? inner : [{ id: newId(), type: 'paragraph', content: [textLeaf('')] }],
      };
    }
    case 'callout': {
      const attrs = node.attrs as Record<string, unknown> | undefined;
      const id = readBlockId(attrs);
      const variant = isCalloutVariant(attrs?.variant) ? attrs.variant : 'info';
      const inner = (node.content ?? [])
        .map((c) => tiptapTopLevelToOur(c))
        .filter((b): b is BlockNodeV0 => b != null);
      return {
        id,
        type: 'callout',
        attrs: { variant },
        content:
          inner.length > 0 ? inner : [{ id: newId(), type: 'paragraph', content: [textLeaf('')] }],
      };
    }
    case 'horizontalRule': {
      return {
        id: readBlockId(node.attrs),
        type: 'horizontal_rule',
        attrs: {},
      };
    }
    case 'image':
      return tiptapImageToOur(node, readBlockId);
    case 'table':
      return tiptapTableToOur(
        node,
        readBlockId,
        tiptapParagraphToOur,
        pmInlineToTextLeaves,
        textLeaf,
        newId
      );
    default: {
      if (node.content?.length) {
        return {
          id: readBlockId(node.attrs),
          type: 'paragraph',
          content: pmInlineToTextLeaves(node.content),
        };
      }
      return null;
    }
  }
}

export function blockDocumentUsesInlineMarks(docBlocks: BlockNodeV0[]): boolean {
  const walk = (node: BlockNodeV0): boolean => {
    if (node.type === 'text') {
      const marks = node.meta?.marks;
      if (Array.isArray(marks) && marks.length > 0) return true;
      return readTextNodeLinkHref(node.meta) != null;
    }
    return (node.content ?? []).some(walk);
  };
  return docBlocks.some(walk);
}

export function blockDocumentUsesSuggestions(docBlocks: BlockNodeV0[]): boolean {
  const walk = (node: BlockNodeV0): boolean => {
    if (node.type === 'text') {
      return readSuggestion(node.meta) != null;
    }
    return (node.content ?? []).some(walk);
  };
  return docBlocks.some(walk);
}
