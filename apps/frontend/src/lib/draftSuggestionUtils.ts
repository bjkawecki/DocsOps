import type { BlockDocument } from '../api/document-types.js';

/** Whether a pending suggestion id exists in the last synced server document. */
export function isSuggestionPersisted(doc: BlockDocument, suggestionId: string): boolean {
  const walk = (nodes: BlockDocument['blocks']): boolean => {
    for (const block of nodes) {
      if (block.type === 'paragraph' || block.type === 'heading') {
        for (const leaf of block.content ?? []) {
          if (leaf.type !== 'text') continue;
          const raw = leaf.meta?.suggestion;
          if (!raw || typeof raw !== 'object') continue;
          const s = raw as Record<string, unknown>;
          if (s.id === suggestionId && s.status === 'pending') return true;
        }
      }
      if (block.content && walk(block.content)) return true;
    }
    return false;
  };
  return walk(doc.blocks);
}
