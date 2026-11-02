import type { FastifyReply } from 'fastify';
import type { PrismaClient } from '../../../../generated/prisma/client.js';
import type { DraftSuggestionMutationResult } from '../services/collaboration/draftSuggestionService.js';
import { notifyLeadDraftCollaborationChanged } from '../services/collaboration/documentCollaborationLiveNotify.js';

type SuggestionMutationError = Extract<DraftSuggestionMutationResult, { ok: false }>['error'];
type SuggestionMutationSuccess = Extract<DraftSuggestionMutationResult, { ok: true }>;

/**
 * Maps draft-suggestion mutation failures to HTTP responses (accept/decline/patch/withdraw).
 */
export function replyDraftSuggestionMutationError(
  reply: FastifyReply,
  error: SuggestionMutationError,
  forbiddenMessage: string
): ReturnType<FastifyReply['send']> {
  if (error === 'not_found') {
    return reply.status(404).send({ error: 'Document not found' });
  }
  if (error === 'suggestion_not_found') {
    return reply.status(404).send({ error: 'Suggestion not found' });
  }
  if (error === 'forbidden') {
    return reply.status(403).send({ error: forbiddenMessage });
  }
  if (error === 'conflict') {
    return reply.status(409).send({
      error: 'Lead-Draft was changed concurrently.',
      code: 'DRAFT_REVISION_CONFLICT',
    });
  }
  return reply.status(409).send({ error });
}

/** ETag + live notify + standard success body for suggestion mutations. */
export function replyDraftSuggestionMutationSuccess(
  reply: FastifyReply,
  prisma: PrismaClient,
  documentId: string,
  userId: string,
  result: SuggestionMutationSuccess
): ReturnType<FastifyReply['send']> {
  reply.header('ETag', `"${result.draftRevision}"`);
  notifyLeadDraftCollaborationChanged(prisma, documentId, userId, {
    draftRevision: result.draftRevision,
    pendingSuggestionCount: result.pendingSuggestionCount,
  });
  return reply.send({
    draftRevision: result.draftRevision,
    blocks: result.blocks,
    pendingSuggestionCount: result.pendingSuggestionCount,
  });
}
