import type { Prisma, PrismaClient } from '../../../../../generated/prisma/client.js';
import { treeifyError } from 'zod';
import {
  safeParseBlockDocument,
  normalizeBlockDocumentSchemaVersion,
  type BlockDocument,
} from '../blocks/blockSchema.js';
import { parseBlockDocumentFromDb } from '../blocks/documentBlocksBackfill.js';
import {
  collectAffectedBlockIds,
  computeDraftOpsFromDocuments,
} from '../collaboration/documentDraftOps.js';

export type LeadDraftView = {
  draftRevision: number;
  blocks: BlockDocument | null;
  canEdit: boolean;
};

export type GetLeadDraftResult =
  | { ok: true; view: LeadDraftView }
  | { ok: false; error: 'not_found' | 'forbidden' };

export async function getLeadDraftForUser(
  prisma: PrismaClient,
  documentId: string,
  opts: { canReadLead: boolean; canEdit: boolean }
): Promise<GetLeadDraftResult> {
  if (!opts.canReadLead) return { ok: false, error: 'forbidden' };
  const doc = await prisma.document.findFirst({
    where: { id: documentId, deletedAt: null },
    select: {
      draftRevision: true,
      draftBlocks: true,
      currentPublishedVersion: { select: { blocks: true } },
    },
  });
  if (!doc) return { ok: false, error: 'not_found' };
  const draftBlocks =
    parseBlockDocumentFromDb(doc.draftBlocks) ??
    parseBlockDocumentFromDb(doc.currentPublishedVersion?.blocks ?? null);
  return {
    ok: true,
    view: {
      draftRevision: doc.draftRevision,
      blocks: draftBlocks,
      canEdit: opts.canEdit,
    },
  };
}

export type PatchLeadDraftInput = {
  blocks: unknown;
  expectedRevision: number;
};

export type PatchLeadDraftContext = {
  userId: string;
  /** When true (scope lead), saves are not logged as author draft changes for reviews. */
  isPublishLead: boolean;
};

export type PatchLeadDraftResult =
  | { ok: true; draftRevision: number; blocks: BlockDocument; hadContentChange: boolean }
  | { ok: false; error: 'not_found' | 'conflict' | 'validation'; issues?: unknown };

function emptyBlockDocument(): BlockDocument {
  return { schemaVersion: 0, blocks: [] };
}

function resolveBeforeBlocks(draftBlocks: unknown, publishedBlocks: unknown): BlockDocument {
  return (
    parseBlockDocumentFromDb(draftBlocks) ??
    parseBlockDocumentFromDb(publishedBlocks) ??
    emptyBlockDocument()
  );
}

/**
 * Atomarer Compare-and-Swap auf `draftRevision` (409 bei Konflikt).
 * Logs block ops to DocumentDraftChange when a non-lead saves with content changes.
 */
export async function patchLeadDraft(
  prisma: PrismaClient,
  documentId: string,
  input: PatchLeadDraftInput,
  ctx: PatchLeadDraftContext
): Promise<PatchLeadDraftResult> {
  const safe = safeParseBlockDocument(input.blocks);
  if (!safe.success) {
    return { ok: false, error: 'validation', issues: treeifyError(safe.error) };
  }
  const parsed = normalizeBlockDocumentSchemaVersion(safe.data);
  const json = parsed as unknown as Prisma.InputJsonValue;

  const beforeRow = await prisma.document.findFirst({
    where: { id: documentId, deletedAt: null, draftRevision: input.expectedRevision },
    select: {
      id: true,
      draftBlocks: true,
      draftRevision: true,
      currentPublishedVersion: { select: { blocks: true } },
    },
  });

  if (!beforeRow) {
    const row = await prisma.document.findFirst({
      where: { id: documentId, deletedAt: null },
      select: { id: true, draftRevision: true },
    });
    if (!row) return { ok: false, error: 'not_found' };
    return { ok: false, error: 'conflict' };
  }

  const beforeDoc = resolveBeforeBlocks(
    beforeRow.draftBlocks,
    beforeRow.currentPublishedVersion?.blocks ?? null
  );
  const ops = computeDraftOpsFromDocuments(beforeDoc, parsed);
  const hadContentChange = ops.length > 0;

  if (!hadContentChange) {
    return {
      ok: true,
      draftRevision: beforeRow.draftRevision,
      blocks: beforeDoc,
      hadContentChange: false,
    };
  }

  const revisionTo = beforeRow.draftRevision + 1;
  const affectedBlockIds = collectAffectedBlockIds(ops);
  const baseBlocksJson =
    (beforeRow.draftBlocks as Prisma.InputJsonValue | null) ??
    (beforeRow.currentPublishedVersion?.blocks as Prisma.InputJsonValue | null) ??
    ({ schemaVersion: 0, blocks: [] } as Prisma.InputJsonValue);

  try {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.document.updateMany({
        where: {
          id: documentId,
          deletedAt: null,
          draftRevision: input.expectedRevision,
        },
        data: {
          draftBlocks: json,
          draftRevision: { increment: 1 },
        },
      });
      if (updated.count === 0) {
        throw new Error('CONFLICT');
      }

      const existingCycle = await tx.documentDraftCycle.findUnique({
        where: { documentId },
        select: { documentId: true },
      });
      if (!existingCycle) {
        await tx.documentDraftCycle.create({
          data: {
            documentId,
            baseBlocks: baseBlocksJson,
          },
        });
      }

      if (!ctx.isPublishLead) {
        await tx.documentDraftChange.create({
          data: {
            documentId,
            revisionFrom: input.expectedRevision,
            revisionTo,
            savedById: ctx.userId,
            ops: ops as unknown as Prisma.InputJsonValue,
            affectedBlockIds,
          },
        });
      }
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'CONFLICT') {
      return { ok: false, error: 'conflict' };
    }
    throw err;
  }

  return { ok: true, draftRevision: revisionTo, blocks: parsed, hadContentChange: true };
}
