import type { PrismaClient } from '../../../../../generated/prisma/client.js';
import { getContextOwnerId } from '../../../organisation/permissions/contextPermissions.js';
import {
  DocumentBusinessError,
  DocumentNotFoundError,
  type DocumentMetadataUpdateResult,
} from './documentService.js';

const DOCUMENT_MOVE_SELECT = {
  id: true,
  title: true,
  pdfUrl: true,
  contextId: true,
  documentTypeKey: true,
  archivedAt: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
  description: true,
  createdById: true,
  createdBy: { select: { name: true } },
  documentTags: { include: { tag: { select: { id: true, name: true } } } },
} as const;

export type MoveDocumentResult = {
  document: DocumentMetadataUpdateResult;
  fromContextId: string;
  toContextId: string;
};

export async function assertContextAcceptsDocuments(
  prisma: PrismaClient,
  contextId: string
): Promise<void> {
  const ctx = await prisma.context.findUnique({
    where: { id: contextId },
    select: {
      process: { select: { deletedAt: true, archivedAt: true } },
      project: { select: { deletedAt: true, archivedAt: true } },
      subcontext: {
        select: {
          project: { select: { deletedAt: true, archivedAt: true } },
        },
      },
    },
  });
  if (!ctx) {
    throw new DocumentBusinessError('Target context not found');
  }
  const process = ctx.process;
  const project = ctx.project ?? ctx.subcontext?.project ?? null;
  if (process) {
    if (process.deletedAt != null) {
      throw new DocumentBusinessError('Target context is in trash');
    }
    if (process.archivedAt != null) {
      throw new DocumentBusinessError('Target context is archived');
    }
    return;
  }
  if (project) {
    if (project.deletedAt != null) {
      throw new DocumentBusinessError('Target context is in trash');
    }
    if (project.archivedAt != null) {
      throw new DocumentBusinessError('Target context is archived');
    }
    return;
  }
  throw new DocumentBusinessError('Target context has no process, project, or subcontext');
}

/**
 * Moves a document to another context in the same owner scope.
 * Caller must enforce canWriteContext on source and target.
 * Cross-owner moves are rejected (Phase 2).
 */
export async function moveDocument(
  prisma: PrismaClient,
  documentId: string,
  targetContextId: string
): Promise<MoveDocumentResult> {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: {
      id: true,
      contextId: true,
      deletedAt: true,
      documentTags: { select: { tag: { select: { ownerId: true } } } },
    },
  });
  if (!doc || doc.deletedAt != null) throw new DocumentNotFoundError(documentId);
  if (doc.contextId == null) {
    throw new DocumentBusinessError('Document has no context; use PATCH to assign a context first');
  }
  if (doc.contextId === targetContextId) {
    throw new DocumentBusinessError('Document is already in the target context');
  }

  await assertContextAcceptsDocuments(prisma, targetContextId);

  const [sourceOwnerId, targetOwnerId] = await Promise.all([
    getContextOwnerId(prisma, doc.contextId),
    getContextOwnerId(prisma, targetContextId),
  ]);
  if (sourceOwnerId == null || targetOwnerId == null) {
    throw new DocumentBusinessError('Context has no owner');
  }
  if (sourceOwnerId !== targetOwnerId) {
    throw new DocumentBusinessError(
      'Cross-owner move requires a move request; use POST /documents/:documentId/move-requests'
    );
  }

  const invalidTag = doc.documentTags.some((row) => row.tag.ownerId !== targetOwnerId);
  if (invalidTag) {
    throw new DocumentBusinessError(
      'Document has tags that do not belong to the target owner scope'
    );
  }

  const fromContextId = doc.contextId;
  const updated = await prisma.document.update({
    where: { id: documentId },
    data: { contextId: targetContextId },
    select: DOCUMENT_MOVE_SELECT,
  });

  return {
    document: updated as DocumentMetadataUpdateResult,
    fromContextId,
    toContextId: targetContextId,
  };
}
