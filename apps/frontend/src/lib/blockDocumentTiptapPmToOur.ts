import type { JSONContent } from '@tiptap/core';
import type { BlockNodeV0 } from '../api/document-types';
import { tiptapImageToOur } from './blockDocumentTiptapImage.js';
import { tiptapTableToOur } from './blockDocumentTiptapTable.js';
import { isCalloutVariant } from './calloutVariant.js';
import {
  newId,
  pmInlineText,
  pmInlineToTextLeaves,
  readBlockId,
  textLeaf,
  tiptapListItemToOur,
  tiptapParagraphToOur,
} from './blockDocumentTiptapInline.js';

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
    case 'mermaid': {
      const id = readBlockId(node.attrs as Record<string, unknown> | undefined);
      const t = pmInlineText(node.content);
      return {
        id,
        type: 'mermaid',
        attrs: {},
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
