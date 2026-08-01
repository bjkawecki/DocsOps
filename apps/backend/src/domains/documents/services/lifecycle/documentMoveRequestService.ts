import type { PrismaClient } from '../../../../../generated/prisma/client.js';
import {
  canWriteContext,
  getContextOwnerId,
} from '../../../organisation/permissions/contextPermissions.js';
import { canRequestDocumentMove } from '../../permissions/canRequestDocumentMove.js';
import {
  DocumentBusinessError,
  DocumentNotFoundError,
  type DocumentMetadataUpdateResult,
} from './documentService.js';
import { assertContextAcceptsDocuments } from './documentMoveService.js';

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

export type DocumentMoveRequestRow = {
  id: string;
  documentId: string;
  fromContextId: string;
  toContextId: string;
  fromOwnerId: string;
  toOwnerId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  requestedById: string;
  decidedById: string | null;
  note: string | null;
  decisionNote: string | null;
  createdAt: Date;
  updatedAt: Date;
  decidedAt: Date | null;
};

export type CreateMoveRequestResult = {
  request: DocumentMoveRequestRow;
};

export type AcceptMoveRequestResult = {
  request: DocumentMoveRequestRow;
  document: DocumentMetadataUpdateResult;
  fromContextId: string;
  toContextId: string;
};

export type DecideMoveRequestResult = {
  request: DocumentMoveRequestRow;
};

/**
 * Creates a pending cross-owner move request. Does not move the document.
 * Caller must enforce canRequestDocumentMove (canWriteContext on source).
 */
export async function createMoveRequest(
  prisma: PrismaClient,
  documentId: string,
  targetContextId: string,
  requestedById: string,
  note?: string | null
): Promise<CreateMoveRequestResult> {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: { id: true, contextId: true, deletedAt: true },
  });
  if (!doc || doc.deletedAt != null) throw new DocumentNotFoundError(documentId);
  if (doc.contextId == null) {
    throw new DocumentBusinessError('Document has no context; use PATCH to assign a context first');
  }
  if (doc.contextId === targetContextId) {
    throw new DocumentBusinessError('Document is already in the target context');
  }

  await assertContextAcceptsDocuments(prisma, targetContextId);

  const [fromOwnerId, toOwnerId] = await Promise.all([
    getContextOwnerId(prisma, doc.contextId),
    getContextOwnerId(prisma, targetContextId),
  ]);
  if (fromOwnerId == null || toOwnerId == null) {
    throw new DocumentBusinessError('Context has no owner');
  }
  if (fromOwnerId === toOwnerId) {
    throw new DocumentBusinessError(
      'Same-owner move does not need a request; use POST /documents/:documentId/move'
    );
  }

  const existingPending = await prisma.documentMoveRequest.findFirst({
    where: { documentId, status: 'pending' },
    select: { id: true },
  });
  if (existingPending) {
    throw new DocumentBusinessError('Document already has a pending move request');
  }

  const request = await prisma.documentMoveRequest.create({
    data: {
      documentId,
      fromContextId: doc.contextId,
      toContextId: targetContextId,
      fromOwnerId,
      toOwnerId,
      status: 'pending',
      requestedById,
      note: note?.trim() ? note.trim() : null,
    },
  });

  return { request };
}

/**
 * Accepts a pending move request: strips all tags, moves document, marks request accepted.
 * Caller must enforce canDecideDocumentMove.
 */
export async function acceptMoveRequest(
  prisma: PrismaClient,
  documentId: string,
  requestId: string,
  decidedById: string,
  decisionNote?: string | null
): Promise<AcceptMoveRequestResult> {
  const req = await prisma.documentMoveRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      documentId: true,
      fromContextId: true,
      toContextId: true,
      status: true,
      document: { select: { contextId: true, deletedAt: true } },
    },
  });
  if (!req || req.documentId !== documentId) {
    throw new DocumentBusinessError('Move request not found');
  }
  if (req.status !== 'pending') {
    throw new DocumentBusinessError('Move request is no longer pending');
  }
  if (req.document.deletedAt != null) {
    throw new DocumentNotFoundError(documentId);
  }
  if (req.document.contextId !== req.fromContextId) {
    throw new DocumentBusinessError(
      'Document is no longer in the source context of this move request'
    );
  }

  await assertContextAcceptsDocuments(prisma, req.toContextId);

  const decidedAt = new Date();
  const [updatedRequest, updatedDocument] = await prisma.$transaction(async (tx) => {
    await tx.documentTag.deleteMany({ where: { documentId } });
    const document = await tx.document.update({
      where: { id: documentId },
      data: { contextId: req.toContextId },
      select: DOCUMENT_MOVE_SELECT,
    });
    const request = await tx.documentMoveRequest.update({
      where: { id: requestId },
      data: {
        status: 'accepted',
        decidedById,
        decidedAt,
        decisionNote: decisionNote?.trim() ? decisionNote.trim() : null,
      },
    });
    return [request, document] as const;
  });

  return {
    request: updatedRequest,
    document: updatedDocument as DocumentMetadataUpdateResult,
    fromContextId: req.fromContextId,
    toContextId: req.toContextId,
  };
}

/**
 * Rejects a pending move request. Caller must enforce canDecideDocumentMove.
 */
export async function rejectMoveRequest(
  prisma: PrismaClient,
  documentId: string,
  requestId: string,
  decidedById: string,
  decisionNote?: string | null
): Promise<DecideMoveRequestResult> {
  const req = await loadPendingRequestOrThrow(prisma, documentId, requestId);
  const request = await prisma.documentMoveRequest.update({
    where: { id: req.id },
    data: {
      status: 'rejected',
      decidedById,
      decidedAt: new Date(),
      decisionNote: decisionNote?.trim() ? decisionNote.trim() : null,
    },
  });
  return { request };
}

/**
 * Withdraws a pending move request. Caller must enforce canWithdrawDocumentMove.
 */
export async function withdrawMoveRequest(
  prisma: PrismaClient,
  documentId: string,
  requestId: string,
  decidedById: string,
  decisionNote?: string | null
): Promise<DecideMoveRequestResult> {
  const req = await loadPendingRequestOrThrow(prisma, documentId, requestId);
  const request = await prisma.documentMoveRequest.update({
    where: { id: req.id },
    data: {
      status: 'withdrawn',
      decidedById,
      decidedAt: new Date(),
      decisionNote: decisionNote?.trim() ? decisionNote.trim() : null,
    },
  });
  return { request };
}

async function loadPendingRequestOrThrow(
  prisma: PrismaClient,
  documentId: string,
  requestId: string
) {
  const req = await prisma.documentMoveRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      documentId: true,
      status: true,
      document: { select: { deletedAt: true } },
    },
  });
  if (!req || req.documentId !== documentId) {
    throw new DocumentBusinessError('Move request not found');
  }
  if (req.document.deletedAt != null) {
    throw new DocumentNotFoundError(documentId);
  }
  if (req.status !== 'pending') {
    throw new DocumentBusinessError('Move request is no longer pending');
  }
  return req;
}

export type PendingMoveRequestForDocument = {
  id: string;
  toContextId: string;
  fromContextId: string;
  fromOwnerId: string;
  toOwnerId: string;
  note: string | null;
  requestedById: string;
  createdAt: string;
  canWithdraw: boolean;
  canAccept: boolean;
  canReject: boolean;
};

/**
 * Loads pending move request flags for GET document detail.
 */
export async function getPendingMoveRequestForDocument(
  prisma: PrismaClient,
  userId: string,
  documentId: string
): Promise<{
  canRequestMove: boolean;
  canAcceptMove: boolean;
  pendingMoveRequest: PendingMoveRequestForDocument | null;
}> {
  const [canRequestMoveBase, pending] = await Promise.all([
    canRequestDocumentMove(prisma, userId, documentId),
    prisma.documentMoveRequest.findFirst({
      where: { documentId, status: 'pending' },
      select: {
        id: true,
        toContextId: true,
        fromContextId: true,
        fromOwnerId: true,
        toOwnerId: true,
        note: true,
        requestedById: true,
        createdAt: true,
      },
    }),
  ]);

  if (!pending) {
    return { canRequestMove: canRequestMoveBase, canAcceptMove: false, pendingMoveRequest: null };
  }

  const [canWithdraw, canAccept] = await Promise.all([
    canWriteContext(prisma, userId, pending.fromContextId),
    canWriteContext(prisma, userId, pending.toContextId),
  ]);

  return {
    canRequestMove: false,
    canAcceptMove: canAccept,
    pendingMoveRequest: {
      id: pending.id,
      toContextId: pending.toContextId,
      fromContextId: pending.fromContextId,
      fromOwnerId: pending.fromOwnerId,
      toOwnerId: pending.toOwnerId,
      note: pending.note,
      requestedById: pending.requestedById,
      createdAt: pending.createdAt.toISOString(),
      canWithdraw,
      canAccept,
      canReject: canAccept,
    },
  };
}
