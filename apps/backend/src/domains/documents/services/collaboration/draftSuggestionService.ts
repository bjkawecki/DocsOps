import type { Prisma, PrismaClient } from '../../../../../generated/prisma/client.js';
import { normalizeBlockDocumentSchemaVersion, type BlockDocument } from '../blocks/blockSchema.js';
import { parseBlockDocumentFromDb } from '../blocks/documentBlocksBackfill.js';
import {
  acceptSuggestionInDocument,
  assertNoOverlappingPendingDeletes,
  AuthorDraftPatchInvalidError,
  countPendingSuggestions,
  declineSuggestionInDocument,
  findSuggestionSpan,
  patchSuggestionTextInDocument,
  SuggestionDeleteOverlapError,
  withdrawSuggestionInDocument,
} from './draftInlineSuggestions.js';

export type DraftSuggestionMutationResult =
  | { ok: true; draftRevision: number; blocks: BlockDocument; pendingSuggestionCount: number }
  | {
      ok: false;
      error:
        | 'not_found'
        | 'conflict'
        | 'forbidden'
        | 'suggestion_not_found'
        | 'author_patch_invalid'
        | 'suggestion_delete_overlap';
    };

async function loadDraftRow(prisma: PrismaClient, documentId: string, expectedRevision: number) {
  return prisma.document.findFirst({
    where: { id: documentId, deletedAt: null, draftRevision: expectedRevision },
    select: {
      id: true,
      draftBlocks: true,
      draftRevision: true,
      currentPublishedVersion: { select: { blocks: true } },
    },
  });
}

function resolveBeforeBlocks(draftBlocks: unknown, publishedBlocks: unknown): BlockDocument {
  return (
    parseBlockDocumentFromDb(draftBlocks) ??
    parseBlockDocumentFromDb(publishedBlocks) ??
    ({ schemaVersion: 0, blocks: [] } as BlockDocument)
  );
}

async function persistDraftBlocks(
  prisma: PrismaClient,
  documentId: string,
  expectedRevision: number,
  blocks: BlockDocument
): Promise<
  | { ok: true; draftRevision: number; blocks: BlockDocument }
  | { ok: false; error: 'not_found' | 'conflict' }
> {
  const normalized = normalizeBlockDocumentSchemaVersion(blocks);
  const json = normalized as unknown as Prisma.InputJsonValue;
  const revisionTo = expectedRevision + 1;

  try {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.document.updateMany({
        where: {
          id: documentId,
          deletedAt: null,
          draftRevision: expectedRevision,
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
      const row = await prisma.document.findFirst({
        where: { id: documentId, deletedAt: null },
        select: { id: true },
      });
      if (!row) return { ok: false, error: 'not_found' };
      return { ok: false, error: 'conflict' };
    }
    throw err;
  }

  return { ok: true, draftRevision: revisionTo, blocks: normalized };
}

async function mutateSuggestion(
  prisma: PrismaClient,
  documentId: string,
  expectedRevision: number,
  suggestionId: string,
  mutate: (doc: BlockDocument) => BlockDocument | null,
  opts: { userId: string; requireAuthor?: boolean; requireLead?: boolean; isLead: boolean }
): Promise<DraftSuggestionMutationResult> {
  const row = await loadDraftRow(prisma, documentId, expectedRevision);
  if (!row) {
    const exists = await prisma.document.findFirst({
      where: { id: documentId, deletedAt: null },
      select: { id: true },
    });
    if (!exists) return { ok: false, error: 'not_found' };
    return { ok: false, error: 'conflict' };
  }

  const doc = resolveBeforeBlocks(row.draftBlocks, row.currentPublishedVersion?.blocks ?? null);
  const span = findSuggestionSpan(doc, suggestionId);
  if (!span || span.suggestion.status !== 'pending') {
    return { ok: false, error: 'suggestion_not_found' };
  }

  if (opts.requireLead && !opts.isLead) {
    return { ok: false, error: 'forbidden' };
  }
  if (opts.requireAuthor && span.suggestion.authorId !== opts.userId) {
    return { ok: false, error: 'forbidden' };
  }

  const next = mutate(doc);
  if (!next) return { ok: false, error: 'suggestion_not_found' };

  try {
    assertNoOverlappingPendingDeletes(next);
  } catch (err) {
    if (err instanceof SuggestionDeleteOverlapError) {
      return { ok: false, error: 'suggestion_delete_overlap' };
    }
    throw err;
  }

  const saved = await persistDraftBlocks(prisma, documentId, expectedRevision, next);
  if (!saved.ok) return saved;

  return {
    ok: true,
    draftRevision: saved.draftRevision,
    blocks: saved.blocks,
    pendingSuggestionCount: countPendingSuggestions(saved.blocks),
  };
}

export async function acceptDraftSuggestion(
  prisma: PrismaClient,
  documentId: string,
  suggestionId: string,
  expectedRevision: number,
  userId: string,
  isLead: boolean
): Promise<DraftSuggestionMutationResult> {
  return mutateSuggestion(
    prisma,
    documentId,
    expectedRevision,
    suggestionId,
    (doc) => acceptSuggestionInDocument(doc, suggestionId),
    { userId, requireLead: true, isLead }
  );
}

export async function declineDraftSuggestion(
  prisma: PrismaClient,
  documentId: string,
  suggestionId: string,
  expectedRevision: number,
  userId: string,
  isLead: boolean
): Promise<DraftSuggestionMutationResult> {
  return mutateSuggestion(
    prisma,
    documentId,
    expectedRevision,
    suggestionId,
    (doc) => declineSuggestionInDocument(doc, suggestionId),
    { userId, requireLead: true, isLead }
  );
}

export async function withdrawDraftSuggestion(
  prisma: PrismaClient,
  documentId: string,
  suggestionId: string,
  expectedRevision: number,
  userId: string
): Promise<DraftSuggestionMutationResult> {
  return mutateSuggestion(
    prisma,
    documentId,
    expectedRevision,
    suggestionId,
    (doc) => withdrawSuggestionInDocument(doc, suggestionId),
    { userId, requireAuthor: true, isLead: false }
  );
}

export async function patchDraftSuggestionText(
  prisma: PrismaClient,
  documentId: string,
  suggestionId: string,
  expectedRevision: number,
  userId: string,
  newText: string
): Promise<DraftSuggestionMutationResult> {
  return mutateSuggestion(
    prisma,
    documentId,
    expectedRevision,
    suggestionId,
    (doc) => patchSuggestionTextInDocument(doc, suggestionId, newText),
    { userId, requireAuthor: true, isLead: false }
  );
}

export { AuthorDraftPatchInvalidError, SuggestionDeleteOverlapError };
