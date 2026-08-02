import { type BlockDocument, type BlockNode } from '../blocks/blockSchema.js';
import {
  readBlockSuggestion,
  isPendingSuggestion,
  inlineBlockTypes,
  findSuggestionSpan,
} from './draftInlineSuggestionQuery.js';

function cloneDoc(doc: BlockDocument): BlockDocument {
  return structuredClone(doc);
}

function stripSuggestionFromMeta(meta: Record<string, unknown>): Record<string, unknown> {
  const next = { ...meta };
  delete next.suggestion;
  return next;
}

function mergeAdjacentTextLeaves(leaves: BlockNode[]): BlockNode[] {
  const out: BlockNode[] = [];
  for (const leaf of leaves) {
    if (leaf.type !== 'text') {
      out.push(leaf);
      continue;
    }
    const prev = out[out.length - 1];
    const prevS = prev ? readBlockSuggestion(prev.meta) : null;
    const curS = readBlockSuggestion(leaf.meta);
    const prevMarks = JSON.stringify(prev?.meta?.marks ?? []);
    const curMarks = JSON.stringify(leaf.meta?.marks ?? []);
    const prevLink = JSON.stringify(prev?.meta?.link ?? null);
    const curLink = JSON.stringify(leaf.meta?.link ?? null);
    if (
      prev?.type === 'text' &&
      !prevS &&
      !curS &&
      prevMarks === curMarks &&
      prevLink === curLink &&
      typeof prev.meta?.text === 'string' &&
      typeof leaf.meta?.text === 'string'
    ) {
      prev.meta = { ...prev.meta, text: prev.meta.text + leaf.meta.text };
      continue;
    }
    out.push(structuredClone(leaf));
  }
  return out;
}

function mapInlineLeaves(
  block: BlockNode,
  mapFn: (leaf: BlockNode) => BlockNode | null
): BlockNode {
  if (!inlineBlockTypes().has(block.type)) return block;
  const content = (block.content ?? [])
    .map((leaf) => (leaf.type === 'text' ? mapFn(leaf) : leaf))
    .filter((l): l is BlockNode => l != null);
  return { ...block, content: mergeAdjacentTextLeaves(content) };
}

function mapDocumentLeaves(
  doc: BlockDocument,
  mapFn: (blockId: string, leaf: BlockNode) => BlockNode | null
): BlockDocument {
  const next = cloneDoc(doc);
  next.blocks = next.blocks.map((block) => {
    if (!inlineBlockTypes().has(block.type)) return block;
    return mapInlineLeaves(block, (leaf) => mapFn(block.id, leaf));
  });
  return next;
}

export function acceptSuggestionInDocument(
  doc: BlockDocument,
  suggestionId: string
): BlockDocument | null {
  const span = findSuggestionSpan(doc, suggestionId);
  if (!span || span.suggestion.status !== 'pending') return null;

  if (span.suggestion.kind === 'insert') {
    return mapDocumentLeaves(doc, (_blockId, leaf) => {
      const s = readBlockSuggestion(leaf.meta);
      if (s?.id !== suggestionId) return leaf;
      const meta = stripSuggestionFromMeta(leaf.meta ?? {});
      return { ...leaf, meta };
    });
  }

  return mapDocumentLeaves(doc, (_blockId, leaf) => {
    const s = readBlockSuggestion(leaf.meta);
    if (s?.id !== suggestionId) return leaf;
    return null;
  });
}

function isEffectivelyEmptyInlineBlock(block: BlockNode): boolean {
  if (!inlineBlockTypes().has(block.type)) return false;
  for (const leaf of block.content ?? []) {
    if (leaf.type !== 'text') continue;
    const text = typeof leaf.meta?.text === 'string' ? leaf.meta.text : '';
    const s = readBlockSuggestion(leaf.meta);
    if (isPendingSuggestion(s)) return false;
    if (text.length > 0) return false;
  }
  return true;
}

function pruneEmptyInlineBlocks(doc: BlockDocument): BlockDocument {
  return {
    ...doc,
    blocks: doc.blocks.filter((block) => {
      if (!inlineBlockTypes().has(block.type)) return true;
      return !isEffectivelyEmptyInlineBlock(block);
    }),
  };
}

export function declineSuggestionInDocument(
  doc: BlockDocument,
  suggestionId: string
): BlockDocument | null {
  const span = findSuggestionSpan(doc, suggestionId);
  if (!span || span.suggestion.status !== 'pending') return null;

  if (span.suggestion.kind === 'insert') {
    const next = mapDocumentLeaves(doc, (_blockId, leaf) => {
      const s = readBlockSuggestion(leaf.meta);
      if (s?.id !== suggestionId) return leaf;
      return null;
    });
    return pruneEmptyInlineBlocks(next);
  }

  return mapDocumentLeaves(doc, (_blockId, leaf) => {
    const s = readBlockSuggestion(leaf.meta);
    if (s?.id !== suggestionId) return leaf;
    const meta = stripSuggestionFromMeta(leaf.meta ?? {});
    return { ...leaf, meta };
  });
}

export function withdrawSuggestionInDocument(
  doc: BlockDocument,
  suggestionId: string
): BlockDocument | null {
  return declineSuggestionInDocument(doc, suggestionId);
}

export function patchSuggestionTextInDocument(
  doc: BlockDocument,
  suggestionId: string,
  newText: string
): BlockDocument | null {
  const span = findSuggestionSpan(doc, suggestionId);
  if (!span || span.suggestion.status !== 'pending' || span.suggestion.kind !== 'insert') {
    return null;
  }

  return mapDocumentLeaves(doc, (_blockId, leaf) => {
    const s = readBlockSuggestion(leaf.meta);
    if (s?.id !== suggestionId) return leaf;
    return {
      ...leaf,
      meta: { ...leaf.meta, text: newText, suggestion: s },
    };
  });
}

/** Materialize resolved canon for publish / export (pending inserts omitted, pending deletes removed). */
export function stripSuggestionsForPublished(doc: BlockDocument): BlockDocument {
  const next = cloneDoc(doc);
  next.blocks = next.blocks
    .map((block) => {
      if (!inlineBlockTypes().has(block.type)) return block;
      const content = (block.content ?? [])
        .filter((leaf) => {
          if (leaf.type !== 'text') return true;
          const s = readBlockSuggestion(leaf.meta);
          if (!isPendingSuggestion(s)) return true;
          if (s.kind === 'delete') return false;
          if (s.kind === 'insert') return false;
          return true;
        })
        .map((leaf) => {
          if (leaf.type !== 'text') return leaf;
          const s = readBlockSuggestion(leaf.meta);
          if (s) {
            const meta = stripSuggestionFromMeta(leaf.meta ?? {});
            return { ...leaf, meta };
          }
          return leaf;
        })
        .filter((leaf) => {
          if (leaf.type !== 'text') return true;
          const text = leaf.meta?.text;
          return typeof text === 'string' && text.length > 0;
        });
      return { ...block, content: mergeAdjacentTextLeaves(content) };
    })
    .filter((block) => {
      if (!inlineBlockTypes().has(block.type)) return true;
      const text = (block.content ?? [])
        .filter((l) => l.type === 'text')
        .map((l) => (typeof l.meta?.text === 'string' ? l.meta.text : ''))
        .join('');
      return text.length > 0;
    });
  return next;
}

function canonTextInBlock(block: BlockNode): string {
  if (!inlineBlockTypes().has(block.type)) return '';
  return (block.content ?? [])
    .filter((l) => l.type === 'text')
    .map((leaf) => {
      const s = readBlockSuggestion(leaf.meta);
      if (isPendingSuggestion(s) && s.kind === 'insert') return '';
      return typeof leaf.meta?.text === 'string' ? leaf.meta.text : '';
    })
    .join('');
}

/**
 * When a lead edits canon text, withdraw pending delete suggestions on affected character ranges.
 */
export function withdrawPendingDeletesAffectedByLeadEdit(
  before: BlockDocument,
  after: BlockDocument
): BlockDocument {
  let result = cloneDoc(after);
  const beforeById = new Map(before.blocks.map((b) => [b.id, b]));

  for (const afterBlock of result.blocks) {
    if (!inlineBlockTypes().has(afterBlock.type)) continue;
    const beforeBlock = beforeById.get(afterBlock.id);
    if (!beforeBlock) continue;

    const beforeCanon = canonTextInBlock(beforeBlock);
    const afterCanon = canonTextInBlock(afterBlock);
    if (beforeCanon === afterCanon) continue;

    result = mapDocumentLeaves(result, (blockId, leaf) => {
      if (blockId !== afterBlock.id) return leaf;
      const s = readBlockSuggestion(leaf.meta);
      if (!isPendingSuggestion(s) || s.kind !== 'delete') return leaf;
      const meta = stripSuggestionFromMeta(leaf.meta ?? {});
      return { ...leaf, meta };
    });
  }

  return result;
}
