import type { JSONContent } from '@tiptap/core';
import type { BlockDocument, BlockNodeV0 } from '../api/document-types';
import { randomId } from './randomId.js';
import {
  isEffectivelyEmptyInlineBlock,
  pruneEmptyTextLeaves,
} from './blockDocumentTiptapExportHelpers.js';
import {
  blockDocumentUsesInlineMarks,
  blockDocumentUsesSuggestions,
  ourTopLevelBlockToTiptap,
  textLeaf,
  tiptapTopLevelToOur,
} from './blockDocumentTiptapNodes.js';

export { innerTextFromBlockNode } from './blockDocumentTiptapNodes.js';

function newId(): string {
  return randomId();
}

export function blockDocumentToTiptapJson(doc: BlockDocument): JSONContent {
  const content = doc.blocks
    .map(ourTopLevelBlockToTiptap)
    .filter((n): n is JSONContent => n != null);
  if (content.length === 0) {
    return {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          attrs: { blockId: newId() },
          content: [],
        },
      ],
    };
  }
  return { type: 'doc', content };
}

export function ensureUniqueBlockIdsInDocument(doc: BlockDocument): BlockDocument {
  const seen = new Set<string>();

  const walk = (node: BlockNodeV0): BlockNodeV0 => {
    let id = node.id;
    if (!id || seen.has(id)) {
      id = newId();
    }
    seen.add(id);
    const content = node.content?.map(walk);
    return content != null ? { ...node, id, content } : { ...node, id };
  };

  return {
    schemaVersion: doc.schemaVersion,
    blocks: doc.blocks.map(walk),
  };
}

export function tiptapJsonToBlockDocument(json: JSONContent): BlockDocument {
  if (json.type !== 'doc' || !json.content?.length) {
    return {
      schemaVersion: 0,
      blocks: [{ id: newId(), type: 'paragraph', content: [textLeaf('')] }],
    };
  }
  const blocks: BlockNodeV0[] = [];
  for (const node of json.content) {
    const b = tiptapTopLevelToOur(node);
    if (!b) continue;
    const pruned = pruneEmptyTextLeaves(b);
    if (isEffectivelyEmptyInlineBlock(pruned)) continue;
    blocks.push(pruned);
  }
  if (blocks.length === 0) {
    return {
      schemaVersion: 0,
      blocks: [{ id: newId(), type: 'paragraph', content: [textLeaf('')] }],
    };
  }
  const deduped = ensureUniqueBlockIdsInDocument({ schemaVersion: 0, blocks });
  return blockDocumentUsesInlineMarks(deduped.blocks) ||
    blockDocumentUsesSuggestions(deduped.blocks)
    ? { schemaVersion: 1, blocks: deduped.blocks }
    : deduped;
}
