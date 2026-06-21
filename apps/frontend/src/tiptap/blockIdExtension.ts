import { Extension } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';
import { randomId } from '../lib/randomId.js';

const BLOCK_ID_NODE_TYPES = new Set([
  'paragraph',
  'heading',
  'codeBlock',
  'bulletList',
  'listItem',
]);

/**
 * Stabile Block-IDs für Roundtrip (Suggestions referenzieren `blockId`).
 * Weist bei Splits und Duplikaten neue IDs zu (ProseMirror kopiert attrs beim Split).
 */
export const BlockIdExtension = Extension.create({
  name: 'blockId',
  addGlobalAttributes() {
    return [
      {
        types: [...BLOCK_ID_NODE_TYPES],
        attributes: {
          blockId: {
            default: null,
            parseHTML: (element) => element.getAttribute('data-block-id'),
            renderHTML: (attributes) => {
              const id = attributes.blockId as string | null | undefined;
              if (!id) return {};
              return { 'data-block-id': id };
            },
          },
        },
      },
    ];
  },
  addProseMirrorPlugins() {
    return [
      new Plugin({
        appendTransaction(transactions, _oldState, newState) {
          if (!transactions.some((tr) => tr.docChanged)) return null;

          const seen = new Set<string>();
          const fixes: { pos: number; attrs: Record<string, unknown> }[] = [];

          newState.doc.descendants((node, pos) => {
            if (!BLOCK_ID_NODE_TYPES.has(node.type.name)) return;
            const blockId = node.attrs.blockId as string | null | undefined;
            if (blockId && !seen.has(blockId)) {
              seen.add(blockId);
              return;
            }
            const nextId = randomId();
            seen.add(nextId);
            fixes.push({ pos, attrs: { ...node.attrs, blockId: nextId } });
          });

          if (fixes.length === 0) return null;

          let tr = newState.tr;
          for (const fix of fixes.sort((a, b) => b.pos - a.pos)) {
            tr = tr.setNodeMarkup(fix.pos, undefined, fix.attrs);
          }
          return tr;
        },
      }),
    ];
  },
});
