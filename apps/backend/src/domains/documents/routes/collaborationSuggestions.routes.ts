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
import { notifyLeadDraftCollaborationChanged } from '../services/collaboration/documentCollaborationLiveNotify.js';

export const registerSuggestionRoutes = (app: FastifyInstance): void => {
  app.post<{ Params: { documentId: string; suggestionId: string } }>(
    '/documents/:documentId/draft/suggestions/:suggestionId/accept',
    {
      preHandler: [requireAuthPreHandler, preHandlerWrap(requireDocumentAccess('readOrWrite'))],
    },
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
        if (result.error === 'not_found')
          return reply.status(404).send({ error: 'Document not found' });
        if (result.error === 'suggestion_not_found') {
          return reply.status(404).send({ error: 'Suggestion not found' });
        }
        if (result.error === 'conflict') {
          return reply.status(409).send({
            error: 'Lead-Draft was changed concurrently.',
            code: 'DRAFT_REVISION_CONFLICT',
          });
        }
        return reply.status(409).send({ error: result.error });
      }
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
  );

  app.post<{ Params: { documentId: string; suggestionId: string } }>(
    '/documents/:documentId/draft/suggestions/:suggestionId/decline',
    {
      preHandler: [requireAuthPreHandler, preHandlerWrap(requireDocumentAccess('readOrWrite'))],
    },
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
        if (result.error === 'not_found')
          return reply.status(404).send({ error: 'Document not found' });
        if (result.error === 'suggestion_not_found') {
          return reply.status(404).send({ error: 'Suggestion not found' });
        }
        if (result.error === 'conflict') {
          return reply.status(409).send({
            error: 'Lead-Draft was changed concurrently.',
            code: 'DRAFT_REVISION_CONFLICT',
          });
        }
        return reply.status(409).send({ error: result.error });
      }
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
  );

  app.patch<{ Params: { documentId: string; suggestionId: string } }>(
    '/documents/:documentId/draft/suggestions/:suggestionId',
    {
      preHandler: [requireAuthPreHandler, preHandlerWrap(requireDocumentAccess('readOrWrite'))],
    },
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
        if (result.error === 'not_found')
          return reply.status(404).send({ error: 'Document not found' });
        if (result.error === 'suggestion_not_found') {
          return reply.status(404).send({ error: 'Suggestion not found' });
        }
        if (result.error === 'forbidden') {
          return reply.status(403).send({ error: 'You cannot edit this suggestion.' });
        }
        if (result.error === 'conflict') {
          return reply.status(409).send({
            error: 'Lead-Draft was changed concurrently.',
            code: 'DRAFT_REVISION_CONFLICT',
          });
        }
        return reply.status(409).send({ error: result.error });
      }
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
  );

  app.delete<{ Params: { documentId: string; suggestionId: string } }>(
    '/documents/:documentId/draft/suggestions/:suggestionId',
    {
      preHandler: [requireAuthPreHandler, preHandlerWrap(requireDocumentAccess('readOrWrite'))],
    },
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
        if (result.error === 'not_found')
          return reply.status(404).send({ error: 'Document not found' });
        if (result.error === 'suggestion_not_found') {
          return reply.status(404).send({ error: 'Suggestion not found' });
        }
        if (result.error === 'forbidden') {
          return reply.status(403).send({ error: 'You cannot withdraw this suggestion.' });
        }
        if (result.error === 'conflict') {
          return reply.status(409).send({
            error: 'Lead-Draft was changed concurrently.',
            code: 'DRAFT_REVISION_CONFLICT',
          });
        }
        return reply.status(409).send({ error: result.error });
      }
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
  );
};
