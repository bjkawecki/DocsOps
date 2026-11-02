import { type BlockDocument, type BlockNode } from '../blocks/blockSchema.js';
import {
  readBlockSuggestion,
  isPendingSuggestion,
  inlineBlockTypes,
} from './draftInlineSuggestionQuery.js';

export class SuggestionDeleteOverlapError extends Error {
  readonly code = 'SUGGESTION_DELETE_OVERLAP' as const;

  constructor(
    message = 'Overlapping pending delete suggestions in the same block are not allowed.'
  ) {
    super(message);
    this.name = 'SuggestionDeleteOverlapError';
  }
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
