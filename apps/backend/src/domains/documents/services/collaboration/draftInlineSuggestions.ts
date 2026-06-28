import {
  blockSuggestionMetaSchema,
  type BlockDocument,
  type BlockNode,
  type BlockSuggestionMeta,
} from '../blocks/blockSchema.js';

/* eslint-disable max-lines -- core suggestion document transforms; validation extracted to draftAuthorPatchValidation.ts */

export class SuggestionDeleteOverlapError extends Error {
  readonly code = 'SUGGESTION_DELETE_OVERLAP' as const;

  constructor(
    message = 'Overlapping pending delete suggestions in the same block are not allowed.'
  ) {
    super(message);
    this.name = 'SuggestionDeleteOverlapError';
  }
}

export type SuggestionSpanLocation = {
  blockId: string;
  leafIndex: number;
  suggestion: BlockSuggestionMeta;
};

function cloneDoc(doc: BlockDocument): BlockDocument {
  return structuredClone(doc);
}

export function readBlockSuggestion(
  meta: Record<string, unknown> | undefined
): BlockSuggestionMeta | null {
  if (!meta?.suggestion || typeof meta.suggestion !== 'object') return null;
  const parsed = blockSuggestionMetaSchema.safeParse(meta.suggestion);
  return parsed.success ? parsed.data : null;
}

function isPendingSuggestion(s: BlockSuggestionMeta | null): s is BlockSuggestionMeta {
  return s != null && s.status === 'pending';
}

function inlineBlockTypes(): Set<string> {
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

type DeleteRange = { start: number; end: number; authorId: string; suggestionId: string };

function collectDeleteRangesInBlock(block: BlockNode): DeleteRange[] {
  if (!inlineBlockTypes().has(block.type)) return [];
  const ranges: DeleteRange[] = [];
  let offset = 0;
  for (const leaf of block.content ?? []) {
    if (leaf.type !== 'text') continue;
    const text = typeof leaf.meta?.text === 'string' ? leaf.meta.text : '';
    const s = readBlockSuggestion(leaf.meta);
    if (isPendingSuggestion(s) && s.kind === 'delete') {
      ranges.push({
        start: offset,
        end: offset + text.length,
        authorId: s.authorId,
        suggestionId: s.id,
      });
    }
    offset += text.length;
  }
  return ranges;
}

function collectMergedCanonDeleteRangesBySuggestion(block: BlockNode): DeleteRange[] {
  if (!inlineBlockTypes().has(block.type)) return [];
  const byId = new Map<string, DeleteRange>();
  let canonPos = 0;
  for (const leaf of block.content ?? []) {
    if (leaf.type !== 'text') continue;
    const text = typeof leaf.meta?.text === 'string' ? leaf.meta.text : '';
    const s = readBlockSuggestion(leaf.meta);
    if (isPendingSuggestion(s) && s.kind === 'insert') continue;
    if (isPendingSuggestion(s) && s.kind === 'delete') {
      const start = canonPos;
      const end = canonPos + text.length;
      const existing = byId.get(s.id);
      if (existing) {
        existing.start = Math.min(existing.start, start);
        existing.end = Math.max(existing.end, end);
      } else {
        byId.set(s.id, {
          start,
          end,
          authorId: s.authorId,
          suggestionId: s.id,
        });
      }
    }
    if (!(isPendingSuggestion(s) && s.kind === 'insert')) {
      canonPos += text.length;
    }
  }
  return [...byId.values()];
}

function blockHasOverlappingDeleteCoverage(block: BlockNode): boolean {
  if (!inlineBlockTypes().has(block.type)) return false;
  const covered = new Set<number>();
  let offset = 0;
  for (const leaf of block.content ?? []) {
    if (leaf.type !== 'text') continue;
    const text = typeof leaf.meta?.text === 'string' ? leaf.meta.text : '';
    const s = readBlockSuggestion(leaf.meta);
    if (isPendingSuggestion(s) && s.kind === 'delete') {
      for (let i = 0; i < text.length; i++) {
        const idx = offset + i;
        if (covered.has(idx)) return true;
        covered.add(idx);
      }
    }
    offset += text.length;
  }
  return false;
}

function rangesOverlap(a: DeleteRange, b: DeleteRange): boolean {
  return a.start < b.end && b.start < a.end;
}

export function assertNoOverlappingPendingDeletes(doc: BlockDocument): void {
  for (const block of doc.blocks) {
    if (blockHasOverlappingDeleteCoverage(block)) {
      throw new SuggestionDeleteOverlapError();
    }
    const merged = collectMergedCanonDeleteRangesBySuggestion(block);
    for (let i = 0; i < merged.length; i++) {
      for (let j = i + 1; j < merged.length; j++) {
        const a = merged[i];
        const b = merged[j];
        if (a && b && a.suggestionId !== b.suggestionId && rangesOverlap(a, b)) {
          throw new SuggestionDeleteOverlapError();
        }
      }
    }
    const ranges = collectDeleteRangesInBlock(block);
    for (let i = 0; i < ranges.length; i++) {
      for (let j = i + 1; j < ranges.length; j++) {
        const a = ranges[i];
        const b = ranges[j];
        if (a && b && rangesOverlap(a, b)) {
          throw new SuggestionDeleteOverlapError();
        }
      }
    }
  }
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
    if (
      prev?.type === 'text' &&
      !prevS &&
      !curS &&
      prevMarks === curMarks &&
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

export {
  AuthorDraftPatchInvalidError,
  validateAuthorDraftPatch,
} from './draftAuthorPatchValidation.js';
