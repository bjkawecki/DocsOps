import type { Prisma, PrismaClient } from '../../../../../generated/prisma/client.js';
import { treeifyError } from 'zod';
import {
  safeParseBlockDocument,
  normalizeBlockDocumentSchemaVersion,
  type BlockDocument,
} from '../blocks/blockSchema.js';
import { parseBlockDocumentFromDb } from '../blocks/documentBlocksBackfill.js';
import {
  assertNoOverlappingPendingDeletes,
  AuthorDraftPatchInvalidError,
  countPendingSuggestions,
  SuggestionDeleteOverlapError,
  validateAuthorDraftPatch,
  withdrawPendingDeletesAffectedByLeadEdit,
} from '../collaboration/draftInlineSuggestions.js';

export type LeadDraftView = {
  draftRevision: number;
  blocks: BlockDocument | null;
  canEdit: boolean;
  pendingSuggestionCount: number;
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
  const pendingSuggestionCount = draftBlocks ? countPendingSuggestions(draftBlocks) : 0;
  return {
    ok: true,
    view: {
      draftRevision: doc.draftRevision,
      blocks: draftBlocks,
      canEdit: opts.canEdit,
      pendingSuggestionCount,
    },
  };
}

export type PatchLeadDraftInput = {
  blocks: unknown;
  expectedRevision: number;
};

export type PatchLeadDraftContext = {
  userId: string;
  /** When true (scope lead), saves apply lead canon edits and withdraw conflicting delete suggestions. */
  isPublishLead: boolean;
};

export type PatchLeadDraftResult =
  | {
      ok: true;
      draftRevision: number;
      blocks: BlockDocument;
      hadContentChange: boolean;
      pendingSuggestionCount: number;
    }
  | {
      ok: false;
      error:
        | 'not_found'
        | 'conflict'
        | 'validation'
        | 'author_patch_invalid'
        | 'suggestion_delete_overlap';
      issues?: unknown;
    };

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

function documentsEqual(a: BlockDocument, b: BlockDocument): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Atomarer Compare-and-Swap auf `draftRevision` (409 bei Konflikt).
 * Lead: full canon edit; Author: suggestion-marked changes only (ADR 004).
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
  let parsed = normalizeBlockDocumentSchemaVersion(safe.data);

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

  if (ctx.isPublishLead) {
    parsed = withdrawPendingDeletesAffectedByLeadEdit(beforeDoc, parsed);
  } else {
    try {
      validateAuthorDraftPatch(beforeDoc, parsed, ctx.userId);
    } catch (err) {
      if (err instanceof AuthorDraftPatchInvalidError) {
        return { ok: false, error: 'author_patch_invalid' };
      }
      if (err instanceof SuggestionDeleteOverlapError) {
        return { ok: false, error: 'suggestion_delete_overlap' };
      }
      throw err;
    }
  }

  try {
    assertNoOverlappingPendingDeletes(parsed);
  } catch (err) {
    if (err instanceof SuggestionDeleteOverlapError) {
      return { ok: false, error: 'suggestion_delete_overlap' };
    }
    throw err;
  }

  const hadContentChange = !documentsEqual(beforeDoc, parsed);
  if (!hadContentChange) {
    return {
      ok: true,
      draftRevision: beforeRow.draftRevision,
      blocks: beforeDoc,
      hadContentChange: false,
      pendingSuggestionCount: countPendingSuggestions(beforeDoc),
    };
  }

  const json = parsed as unknown as Prisma.InputJsonValue;
  const revisionTo = beforeRow.draftRevision + 1;

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
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'CONFLICT') {
      return { ok: false, error: 'conflict' };
    }
    throw err;
  }

  return {
    ok: true,
    draftRevision: revisionTo,
    blocks: parsed,
    hadContentChange: true,
    pendingSuggestionCount: countPendingSuggestions(parsed),
  };
}
