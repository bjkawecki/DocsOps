import type { FastifyInstance } from 'fastify';
import { requireAuthPreHandler, preHandlerWrap } from '../../auth/middleware.js';
import { requireDocumentAccess, canResolveDraftSuggestion } from '../permissions/index.js';
import {
  acceptDraftSuggestion,
  declineDraftSuggestion,
  patchDraftSuggestionText,
  withdrawDraftSuggestion,
} from '../services/collaboration/draftSuggestionService.js';
import {
  draftSuggestionRevisionBodySchema,
  patchDraftSuggestionBodySchema,
} from '../schemas/documents.js';
import { routePrismaUserDocumentId } from './collaboration-route-helpers.js';
import {
  replyDraftSuggestionMutationError,
  replyDraftSuggestionMutationSuccess,
} from './collaborationSuggestions-route-helpers.js';

const suggestionMutationPreHandler = [
  requireAuthPreHandler,
  preHandlerWrap(requireDocumentAccess('readOrWrite')),
] as const;

export const registerSuggestionRoutes = (app: FastifyInstance): void => {
  app.post<{ Params: { documentId: string; suggestionId: string } }>(
    '/documents/:documentId/draft/suggestions/:suggestionId/accept',
    { preHandler: [...suggestionMutationPreHandler] },
    async (request, reply) => {
      const { prisma, userId, documentId } = routePrismaUserDocumentId(request);
      const { suggestionId } = request.params;
      const body = draftSuggestionRevisionBodySchema.parse(request.body);
      const isLead = await canResolveDraftSuggestion(prisma, userId, documentId);
      if (!isLead) {
        return reply.status(403).send({ error: 'Only the scope lead can accept suggestions.' });
      }
      const result = await acceptDraftSuggestion(
        prisma,
        documentId,
        suggestionId,
        body.expectedRevision,
        userId,
        isLead
      );
      if (!result.ok) {
        return replyDraftSuggestionMutationError(reply, result.error, 'Forbidden');
      }
      return replyDraftSuggestionMutationSuccess(reply, prisma, documentId, userId, result);
    }
  );

  app.post<{ Params: { documentId: string; suggestionId: string } }>(
    '/documents/:documentId/draft/suggestions/:suggestionId/decline',
    { preHandler: [...suggestionMutationPreHandler] },
    async (request, reply) => {
      const { prisma, userId, documentId } = routePrismaUserDocumentId(request);
      const { suggestionId } = request.params;
      const body = draftSuggestionRevisionBodySchema.parse(request.body);
      const isLead = await canResolveDraftSuggestion(prisma, userId, documentId);
      if (!isLead) {
        return reply.status(403).send({ error: 'Only the scope lead can decline suggestions.' });
      }
      const result = await declineDraftSuggestion(
        prisma,
        documentId,
        suggestionId,
        body.expectedRevision,
        userId,
        isLead
      );
      if (!result.ok) {
        return replyDraftSuggestionMutationError(reply, result.error, 'Forbidden');
      }
      return replyDraftSuggestionMutationSuccess(reply, prisma, documentId, userId, result);
    }
  );

  app.patch<{ Params: { documentId: string; suggestionId: string } }>(
    '/documents/:documentId/draft/suggestions/:suggestionId',
    { preHandler: [...suggestionMutationPreHandler] },
    async (request, reply) => {
      const { prisma, userId, documentId } = routePrismaUserDocumentId(request);
      const { suggestionId } = request.params;
      const body = patchDraftSuggestionBodySchema.parse(request.body);
      const result = await patchDraftSuggestionText(
        prisma,
        documentId,
        suggestionId,
        body.expectedRevision,
        userId,
        body.text
      );
      if (!result.ok) {
        return replyDraftSuggestionMutationError(
          reply,
          result.error,
          'You cannot edit this suggestion.'
        );
      }
      return replyDraftSuggestionMutationSuccess(reply, prisma, documentId, userId, result);
    }
  );

  app.delete<{ Params: { documentId: string; suggestionId: string } }>(
    '/documents/:documentId/draft/suggestions/:suggestionId',
    { preHandler: [...suggestionMutationPreHandler] },
    async (request, reply) => {
      const { prisma, userId, documentId } = routePrismaUserDocumentId(request);
      const { suggestionId } = request.params;
      const body = draftSuggestionRevisionBodySchema.parse(request.body);
      const result = await withdrawDraftSuggestion(
        prisma,
        documentId,
        suggestionId,
        body.expectedRevision,
        userId
      );
      if (!result.ok) {
        return replyDraftSuggestionMutationError(
          reply,
          result.error,
          'You cannot withdraw this suggestion.'
        );
      }
      return replyDraftSuggestionMutationSuccess(reply, prisma, documentId, userId, result);
    }
  );
};
