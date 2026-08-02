import type { JSONContent } from '@tiptap/core';
import type { BlockNodeV0 } from '../api/document-types';
import { imageOurToTiptap } from './blockDocumentTiptapImage.js';
import { tableOurToTiptap } from './blockDocumentTiptapTable.js';
import { isCalloutVariant } from './calloutVariant.js';
import {
  blockInlineContentToTiptap,
  innerTextFromBlockNode,
  listItemOurToTiptap,
  newId,
  paragraphOurToTiptap,
  textLeaf,
  type TiptapConvertContext,
} from './blockDocumentTiptapInline.js';

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
    case 'mermaid': {
      const text = innerTextFromBlockNode(block);
      return {
        type: 'mermaid',
        attrs: { blockId: block.id },
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
