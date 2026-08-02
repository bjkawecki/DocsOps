import type { JSONContent } from '@tiptap/core';
import type { BlockNodeV0 } from '../api/document-types';
import {
  blockLinkFromEditorHref,
  editorHrefFromBlockLink,
  readTextNodeLink,
  type BlockTextLink,
} from './blockLinkHref.js';
import { randomId } from './randomId.js';
import { mergeAdjacentSuggestionLeaves } from './blockDocumentTiptapExportHelpers.js';

/** Shared low-level helpers (text leaves, marks/suggestions/links, paragraph/list nodes) used by both conversion directions. */

export type TiptapConvertContext = {
  documentId?: string;
};

type InlineMark = 'bold' | 'italic' | 'code';

export type BlockSuggestion = {
  id: string;
  kind: 'insert' | 'delete';
  authorId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  createdAt: string;
};

export function newId(): string {
  return randomId();
}

function readMarks(meta: Record<string, unknown> | undefined): InlineMark[] {
  const raw = meta?.marks;
  if (!Array.isArray(raw)) return [];
  return raw.filter((m): m is InlineMark => m === 'bold' || m === 'italic' || m === 'code');
}

export function readSuggestion(meta: Record<string, unknown> | undefined): BlockSuggestion | null {
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
  link?: BlockTextLink
): BlockNodeV0 {
  const meta: Record<string, unknown> = { text };
  if (marks?.length) meta.marks = marks;
  if (suggestion) meta.suggestion = suggestion;
  if (link != null) meta.link = link;
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

export function pmInlineText(content: JSONContent[] | undefined): string {
  if (!content?.length) return '';
  let s = '';
  for (const c of content) {
    if (c.type === 'text' && typeof c.text === 'string') s += c.text;
    else if (c.type === 'hardBreak') s += '\n';
    else if (c.content?.length) s += pmInlineText(c.content);
  }
  return s;
}

export function readBlockId(attrs: Record<string, unknown> | undefined): string {
  const raw = attrs?.blockId;
  return typeof raw === 'string' && raw.length > 0 ? raw : newId();
}

export function pmInlineToTextLeaves(content: JSONContent[] | undefined): BlockNodeV0[] {
  const leaves: BlockNodeV0[] = [];
  for (const c of content ?? []) {
    if (c.type === 'text' && typeof c.text === 'string') {
      const marks: InlineMark[] = [];
      let suggestion: BlockSuggestion | undefined;
      let link: BlockTextLink | undefined;
      for (const mark of c.marks ?? []) {
        if (mark.type === 'bold') marks.push('bold');
        if (mark.type === 'italic') marks.push('italic');
        if (mark.type === 'code') marks.push('code');
        if (mark.type === 'link') {
          const attrs = mark.attrs as { href?: unknown } | undefined;
          const href = attrs?.href;
          if (typeof href === 'string') {
            const parsed = blockLinkFromEditorHref(href);
            if (parsed) link = parsed;
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
      leaves.push(textLeaf(c.text, marks.length ? marks : undefined, suggestion, link));
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

export function blockInlineContentToTiptap(content: BlockNodeV0[] | undefined): JSONContent[] {
  const out: JSONContent[] = [];
  for (const leaf of content ?? []) {
    if (leaf.type !== 'text') continue;
    const text = innerTextFromBlockNode(leaf);
    if (!text) continue;
    const marks = readMarks(leaf.meta);
    const suggestion = readSuggestion(leaf.meta);
    const link = readTextNodeLink(leaf.meta);
    const pmMarks: JSONContent['marks'] = marks.map((m) => ({ type: m }));
    if (link != null) {
      pmMarks.push({ type: 'link', attrs: { href: editorHrefFromBlockLink(link) } });
    }
    if (suggestion?.status === 'pending') {
      pmMarks.push(suggestionToPmMark(suggestion));
    }
    out.push({ type: 'text', text, ...(pmMarks.length ? { marks: pmMarks } : {}) });
  }
  return out;
}

export function paragraphOurToTiptap(p: BlockNodeV0): JSONContent {
  return {
    type: 'paragraph',
    attrs: { blockId: p.id },
    content: blockInlineContentToTiptap(p.content),
  };
}

export function listItemOurToTiptap(item: BlockNodeV0): JSONContent {
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

export function tiptapParagraphToOur(node: JSONContent): BlockNodeV0 {
  const id = readBlockId(node.attrs);
  const leaves = pmInlineToTextLeaves(node.content);
  return {
    id,
    type: 'paragraph',
    content: leaves,
  };
}

export function tiptapListItemToOur(node: JSONContent): BlockNodeV0 {
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
