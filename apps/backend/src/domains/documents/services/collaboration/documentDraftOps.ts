import { z } from 'zod';
import { blockNodeSchema, type BlockDocument, type BlockNode } from '../blocks/blockSchema.js';

/** Sentinel for insertAfter at document start (empty draft). */
export const DRAFT_OPS_ROOT_ANCHOR = '__ROOT__';

export const draftReplaceBlockOpSchema = z.object({
  op: z.literal('replaceBlock'),
  blockId: z.string().min(1),
  block: blockNodeSchema,
});

export const draftInsertAfterOpSchema = z.object({
  op: z.literal('insertAfter'),
  afterBlockId: z.string().min(1),
  blocks: z.array(blockNodeSchema).min(1),
});

export const draftDeleteBlockOpSchema = z.object({
  op: z.literal('deleteBlock'),
  blockId: z.string().min(1),
});

export const draftOpSchema = z.discriminatedUnion('op', [
  draftReplaceBlockOpSchema,
  draftInsertAfterOpSchema,
  draftDeleteBlockOpSchema,
]);

export type DraftOp = z.infer<typeof draftOpSchema>;

export const draftOpsArraySchema = z.array(draftOpSchema).min(1);

function findTopLevelIndex(blocks: BlockNode[], blockId: string): number {
  return blocks.findIndex((b) => b.id === blockId);
}

function blockJsonEqual(a: BlockNode, b: BlockNode): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Applies draft ops to a copy of `document` (top-level blocks only).
 */
export function applyDraftOpsToDocument(
  document: BlockDocument,
  ops: DraftOp[]
): { ok: true; document: BlockDocument } | { ok: false; error: string } {
  const next: BlockDocument = structuredClone(document);
  for (const op of ops) {
    if (op.op === 'deleteBlock') {
      const idx = findTopLevelIndex(next.blocks, op.blockId);
      if (idx < 0)
        return {
          ok: false,
          error: `deleteBlock: Block "${op.blockId}" not found (top-level only).`,
        };
      next.blocks.splice(idx, 1);
    } else if (op.op === 'replaceBlock') {
      const idx = findTopLevelIndex(next.blocks, op.blockId);
      if (idx < 0)
        return {
          ok: false,
          error: `replaceBlock: Block "${op.blockId}" not found (top-level only).`,
        };
      next.blocks[idx] = op.block;
    } else if (op.op === 'insertAfter') {
      if (op.afterBlockId === DRAFT_OPS_ROOT_ANCHOR) {
        next.blocks.unshift(...op.blocks);
        continue;
      }
      const idx = findTopLevelIndex(next.blocks, op.afterBlockId);
      if (idx < 0)
        return {
          ok: false,
          error: `insertAfter: Block "${op.afterBlockId}" not found (top-level only).`,
        };
      next.blocks.splice(idx + 1, 0, ...op.blocks);
    }
  }
  return { ok: true, document: next };
}

export function collectAffectedBlockIds(ops: DraftOp[]): string[] {
  const ids = new Set<string>();
  for (const op of ops) {
    if (op.op === 'deleteBlock' || op.op === 'replaceBlock') {
      ids.add(op.blockId);
    } else if (op.op === 'insertAfter') {
      if (op.afterBlockId !== DRAFT_OPS_ROOT_ANCHOR) ids.add(op.afterBlockId);
      for (const b of op.blocks) ids.add(b.id);
    }
  }
  return [...ids];
}

/**
 * Computes minimal top-level block ops from `before` to `after`.
 */
export function computeDraftOpsFromDocuments(
  before: BlockDocument,
  after: BlockDocument
): DraftOp[] {
  const oldBlocks = before.blocks;
  const newBlocks = after.blocks;

  if (JSON.stringify(oldBlocks) === JSON.stringify(newBlocks)) {
    return [];
  }

  if (oldBlocks.length === 0 && newBlocks.length > 0) {
    return [{ op: 'insertAfter', afterBlockId: DRAFT_OPS_ROOT_ANCHOR, blocks: newBlocks }];
  }

  const oldIdSet = new Set(oldBlocks.map((b) => b.id));
  const newIdSet = new Set(newBlocks.map((b) => b.id));
  const sameOrder =
    oldBlocks.length === newBlocks.length && oldBlocks.every((b, i) => b.id === newBlocks[i]?.id);

  if (sameOrder) {
    const ops: DraftOp[] = [];
    for (let i = 0; i < newBlocks.length; i++) {
      const oldBlock = oldBlocks[i];
      const newBlock = newBlocks[i];
      if (oldBlock == null || newBlock == null) continue;
      if (!blockJsonEqual(oldBlock, newBlock)) {
        ops.push({ op: 'replaceBlock', blockId: newBlock.id, block: newBlock });
      }
    }
    return ops;
  }

  const oldIds = oldBlocks.map((b) => b.id).join('\0');
  const newIds = newBlocks.map((b) => b.id).join('\0');
  const orderOrMembershipChanged =
    oldIds !== newIds ||
    oldIdSet.size !== newIdSet.size ||
    [...oldIdSet].some((id) => !newIdSet.has(id));

  if (orderOrMembershipChanged) {
    const ops: DraftOp[] = [];
    for (const b of [...oldBlocks].reverse()) {
      ops.push({ op: 'deleteBlock', blockId: b.id });
    }
    if (newBlocks.length > 0) {
      ops.push({ op: 'insertAfter', afterBlockId: DRAFT_OPS_ROOT_ANCHOR, blocks: newBlocks });
    }
    return ops;
  }

  const ops: DraftOp[] = [];
  for (const nb of newBlocks) {
    const ob = oldBlocks.find((b) => b.id === nb.id);
    if (ob && !blockJsonEqual(ob, nb)) {
      ops.push({ op: 'replaceBlock', blockId: nb.id, block: nb });
    }
  }
  return ops;
}
