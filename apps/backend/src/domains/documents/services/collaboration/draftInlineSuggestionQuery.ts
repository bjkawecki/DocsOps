import {
  blockSuggestionMetaSchema,
  type BlockDocument,
  type BlockNode,
  type BlockSuggestionMeta,
} from '../blocks/blockSchema.js';

export function readBlockSuggestion(
  meta: Record<string, unknown> | undefined
): BlockSuggestionMeta | null {
  if (!meta?.suggestion || typeof meta.suggestion !== 'object') return null;
  const parsed = blockSuggestionMetaSchema.safeParse(meta.suggestion);
  return parsed.success ? parsed.data : null;
}

export function isPendingSuggestion(s: BlockSuggestionMeta | null): s is BlockSuggestionMeta {
  return s != null && s.status === 'pending';
}

export function inlineBlockTypes(): Set<string> {
  return new Set(['paragraph', 'heading']);
}

function walkTextLeaves(
  node: BlockNode,
  blockId: string,
  visit: (blockId: string, leafIndex: number, leaf: BlockNode) => void
): void {
  if (node.type === 'text') return;
  const isInlineBlock = inlineBlockTypes().has(node.type);
  const currentBlockId = isInlineBlock ? node.id : blockId;
  const leaves = node.content ?? [];
  if (isInlineBlock) {
    leaves.forEach((leaf, i) => {
      if (leaf.type === 'text') visit(currentBlockId, i, leaf);
    });
    return;
  }
  for (const child of leaves) {
    walkTextLeaves(child, currentBlockId, visit);
  }
}

export function countPendingSuggestions(doc: BlockDocument): number {
  let count = 0;
  for (const block of doc.blocks) {
    walkTextLeaves(block, block.id, (_bid, _idx, leaf) => {
      const s = readBlockSuggestion(leaf.meta);
      if (isPendingSuggestion(s)) count += 1;
    });
  }
  return count;
}

export function collectPendingSuggestionMeta(doc: BlockDocument): BlockSuggestionMeta[] {
  const out: BlockSuggestionMeta[] = [];
  for (const block of doc.blocks) {
    walkTextLeaves(block, block.id, (_bid, _idx, leaf) => {
      const s = readBlockSuggestion(leaf.meta);
      if (isPendingSuggestion(s)) out.push(s);
    });
  }
  return out;
}

export type SuggestionSpanLocation = {
  blockId: string;
  leafIndex: number;
  suggestion: BlockSuggestionMeta;
};

export function findSuggestionSpan(
  doc: BlockDocument,
  suggestionId: string
): SuggestionSpanLocation | null {
  let found: SuggestionSpanLocation | null = null;
  for (const block of doc.blocks) {
    walkTextLeaves(block, block.id, (blockId, leafIndex, leaf) => {
      const s = readBlockSuggestion(leaf.meta);
      if (s?.id === suggestionId) {
        found = { blockId, leafIndex, suggestion: s };
      }
    });
  }
  return found;
}

export type PendingSuggestionSummary = {
  pendingSuggestionCount: number;
  lastSuggestionAt: string | null;
  authorIds: string[];
};

export function summarizePendingSuggestions(doc: BlockDocument): PendingSuggestionSummary {
  const metas = collectPendingSuggestionMeta(doc);
  const authorIds = [...new Set(metas.map((m) => m.authorId))];
  let lastSuggestionAt: string | null = null;
  for (const m of metas) {
    if (lastSuggestionAt == null || m.createdAt > lastSuggestionAt) {
      lastSuggestionAt = m.createdAt;
    }
  }
  return {
    pendingSuggestionCount: metas.length,
    lastSuggestionAt,
    authorIds,
  };
}
