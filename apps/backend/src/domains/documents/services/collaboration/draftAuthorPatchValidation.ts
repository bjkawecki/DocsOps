import {
  blockSuggestionMetaSchema,
  type BlockDocument,
  type BlockNode,
  type BlockSuggestionMeta,
} from '../blocks/blockSchema.js';
import { assertNoOverlappingPendingDeletes } from './draftInlineSuggestions.js';

export class AuthorDraftPatchInvalidError extends Error {
  readonly code = 'AUTHOR_DRAFT_PATCH_INVALID' as const;

  constructor(message = 'Author may only change suggestion-marked content.') {
    super(message);
    this.name = 'AuthorDraftPatchInvalidError';
  }
}

function inlineBlockTypes(): Set<string> {
  return new Set(['paragraph', 'heading']);
}

function readBlockSuggestion(
  meta: Record<string, unknown> | undefined
): BlockSuggestionMeta | null {
  if (!meta?.suggestion || typeof meta.suggestion !== 'object') return null;
  const parsed = blockSuggestionMetaSchema.safeParse(meta.suggestion);
  return parsed.success ? parsed.data : null;
}

function isPendingSuggestion(s: BlockSuggestionMeta | null): s is BlockSuggestionMeta {
  return s != null && s.status === 'pending';
}

function leafCanonKey(leaf: BlockNode): string {
  if (leaf.type !== 'text') return '';
  const text = typeof leaf.meta?.text === 'string' ? leaf.meta.text : '';
  const marks = JSON.stringify(leaf.meta?.marks ?? []);
  const s = readBlockSuggestion(leaf.meta);
  if (isPendingSuggestion(s) && s.kind === 'insert') return '';
  return `${text}\0${marks}`;
}

function normalizedCanonParts(block: BlockNode): string[] {
  if (!inlineBlockTypes().has(block.type)) return [];
  const parts: string[] = [];
  let open: { marksKey: string; text: string } | null = null;

  const flush = () => {
    if (open) {
      parts.push(`${open.text}\0${open.marksKey}`);
      open = null;
    }
  };

  for (const leaf of block.content ?? []) {
    if (leaf.type !== 'text') continue;
    const key = leafCanonKey(leaf);
    if (!key.length) {
      flush();
      continue;
    }
    const sep = key.indexOf('\0');
    const text = key.slice(0, sep);
    const marksKey = key.slice(sep + 1);
    if (open && open.marksKey === marksKey) {
      open.text += text;
    } else {
      flush();
      open = { marksKey, text };
    }
  }
  flush();
  return parts;
}

function blockCanonSignature(block: BlockNode): string {
  if (!inlineBlockTypes().has(block.type)) {
    return JSON.stringify(block);
  }
  const parts = normalizedCanonParts(block);
  return `${block.id}\0${parts.join('\0')}`;
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

/**
 * Authors may only add/change/withdraw their own suggestion marks; unmarked canon must stay identical.
 */
export function validateAuthorDraftPatch(
  before: BlockDocument,
  after: BlockDocument,
  userId: string
): void {
  const beforeBlocks = new Map(before.blocks.map((b) => [b.id, b]));
  const afterBlocks = new Map(after.blocks.map((b) => [b.id, b]));

  for (const [blockId, beforeBlock] of beforeBlocks) {
    const afterBlock = afterBlocks.get(blockId);
    if (!afterBlock) {
      throw new AuthorDraftPatchInvalidError('Authors cannot remove existing blocks.');
    }
    if (inlineBlockTypes().has(beforeBlock.type) && inlineBlockTypes().has(afterBlock.type)) {
      if (blockCanonSignature(beforeBlock) !== blockCanonSignature(afterBlock)) {
        throw new AuthorDraftPatchInvalidError('Unmarked canon text must not change.');
      }
    } else if (JSON.stringify(beforeBlock) !== JSON.stringify(afterBlock)) {
      throw new AuthorDraftPatchInvalidError('Authors cannot modify non-inline blocks.');
    }
  }

  for (const afterBlock of after.blocks) {
    const beforeBlock = beforeBlocks.get(afterBlock.id);
    if (!beforeBlock) {
      if (!inlineBlockTypes().has(afterBlock.type)) {
        throw new AuthorDraftPatchInvalidError('Authors cannot add structural blocks in phase 1.');
      }
      if (isEffectivelyEmptyInlineBlock(afterBlock)) continue;
      const leaves = afterBlock.content ?? [];
      for (const leaf of leaves) {
        if (leaf.type !== 'text') continue;
        const s = readBlockSuggestion(leaf.meta);
        if (!isPendingSuggestion(s) || s.kind !== 'insert' || s.authorId !== userId) {
          throw new AuthorDraftPatchInvalidError(
            'New blocks must be insert suggestions by the author.'
          );
        }
      }
      continue;
    }

    if (!inlineBlockTypes().has(afterBlock.type)) {
      if (JSON.stringify(beforeBlock) !== JSON.stringify(afterBlock)) {
        throw new AuthorDraftPatchInvalidError('Authors cannot modify non-inline blocks.');
      }
      continue;
    }

    const beforeLeaves = (beforeBlock.content ?? []).filter((l) => l.type === 'text');
    const afterLeaves = (afterBlock.content ?? []).filter((l) => l.type === 'text');

    for (const afterLeaf of afterLeaves) {
      const s = readBlockSuggestion(afterLeaf.meta);
      if (!s) continue;
      if (s.authorId !== userId) {
        throw new AuthorDraftPatchInvalidError('Cannot modify another author’s suggestion.');
      }
      if (s.status !== 'pending') {
        throw new AuthorDraftPatchInvalidError('Only pending suggestions are allowed.');
      }
    }

    for (const beforeLeaf of beforeLeaves) {
      const bs = readBlockSuggestion(beforeLeaf.meta);
      if (!isPendingSuggestion(bs) || bs.authorId !== userId) continue;
      const stillThere = afterLeaves.some((al) => readBlockSuggestion(al.meta)?.id === bs.id);
      if (!stillThere) continue;
    }
  }

  assertNoOverlappingPendingDeletes(after);
}
