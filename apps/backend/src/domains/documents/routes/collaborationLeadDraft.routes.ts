import type { FastifyInstance } from 'fastify';
import { requireAuthPreHandler, preHandlerWrap } from '../../auth/middleware.js';
import {
  requireDocumentAccess,
  canReadLeadDraft,
  canEditLeadDraft,
  canPublishDocument,
} from '../permissions/index.js';
import { getLeadDraftForUser, patchLeadDraft } from '../services/lifecycle/leadDraftService.js';
import { patchLeadDraftBodySchema } from '../schemas/documents.js';
import { routePrismaUserDocumentId } from './collaboration-route-helpers.js';
import { notifyLeadDraftCollaborationChanged } from '../services/collaboration/documentCollaborationLiveNotify.js';

export const registerLeadDraftRoutes = (app: FastifyInstance): void => {
  /**
   * GET gemeinsamer Lead-Draft (Block-JSON). Nicht für reine Leser ohne Write/Lead (403).
   */
  app.get<{ Params: { documentId: string } }>(
    '/documents/:documentId/lead-draft',
    {
      preHandler: [requireAuthPreHandler, preHandlerWrap(requireDocumentAccess('readOrWrite'))],
    },
    async (request, reply) => {
      const { prisma, userId, documentId } = routePrismaUserDocumentId(request);

      const [canReadLead, canEdit] = await Promise.all([
        canReadLeadDraft(prisma, userId, documentId),
        canEditLeadDraft(prisma, userId, documentId),
      ]);

      const result = await getLeadDraftForUser(prisma, documentId, {
        canReadLead,
        canEdit,
      });

      if (!result.ok) {
        if (result.error === 'forbidden') {
          return reply.status(403).send({ error: 'Kein Zugriff auf den Lead-Draft.' });
        }
        return reply.status(404).send({ error: 'Document not found' });
      }

      reply.header('ETag', `"${result.view.draftRevision}"`);
      return reply.send({
        draftRevision: result.view.draftRevision,
        blocks: result.view.blocks,
        canEdit: result.view.canEdit,
        pendingSuggestionCount: result.view.pendingSuggestionCount,
      });
    }
  );

  /** PATCH Lead-Draft – scope lead, scope author, or personal owner; optimistic lock via expectedRevision. */
  app.patch<{ Params: { documentId: string } }>(
    '/documents/:documentId/lead-draft',
    {
      preHandler: [requireAuthPreHandler, preHandlerWrap(requireDocumentAccess('readOrWrite'))],
    },
    async (request, reply) => {
      const { prisma, userId, documentId } = routePrismaUserDocumentId(request);

      const canEdit = await canEditLeadDraft(prisma, userId, documentId);
      if (!canEdit) {
        return reply.status(403).send({ error: 'You cannot edit this draft.' });
      }

      const body = patchLeadDraftBodySchema.parse(request.body);
      const ifMatchRaw = request.headers['if-match'];
      if (typeof ifMatchRaw === 'string' && ifMatchRaw.trim() !== '') {
        const stripped = ifMatchRaw
          .trim()
          .replace(/^W\//i, '')
          .replace(/^["']|["']$/g, '');
        const tagRev = Number.parseInt(stripped, 10);
        if (!Number.isNaN(tagRev) && tagRev !== body.expectedRevision) {
          return reply.status(400).send({
            error: 'If-Match und expectedRevision widersprechen sich.',
          });
        }
      }

      const isPublishLead = await canPublishDocument(prisma, userId, documentId);
      const patchResult = await patchLeadDraft(
        prisma,
        documentId,
        {
          blocks: body.blocks,
          expectedRevision: body.expectedRevision,
        },
        { userId, isPublishLead }
      );

      if (!patchResult.ok) {
        if (patchResult.error === 'not_found') {
          return reply.status(404).send({ error: 'Document not found' });
        }
        if (patchResult.error === 'validation') {
          return reply.status(400).send({
            error: 'Ungültige Blocks',
            details: patchResult.issues,
          });
        }
        if (patchResult.error === 'author_patch_invalid') {
          return reply.status(400).send({
            error: 'Author may only change suggestion-marked content.',
            code: 'AUTHOR_DRAFT_PATCH_INVALID',
          });
        }
        if (patchResult.error === 'suggestion_delete_overlap') {
          return reply.status(409).send({
            error: 'Overlapping pending delete suggestions are not allowed.',
            code: 'SUGGESTION_DELETE_OVERLAP',
          });
        }
        return reply.status(409).send({
          error: 'Lead-Draft wurde zwischenzeitlich geändert.',
          code: 'DRAFT_REVISION_CONFLICT',
        });
      }

      reply.header('ETag', `"${patchResult.draftRevision}"`);
      if (patchResult.hadContentChange) {
        notifyLeadDraftCollaborationChanged(prisma, documentId, userId, {
          draftRevision: patchResult.draftRevision,
          pendingSuggestionCount: patchResult.pendingSuggestionCount,
        });
      }
      return reply.send({
        draftRevision: patchResult.draftRevision,
        blocks: patchResult.blocks,
        canEdit: true,
        pendingSuggestionCount: patchResult.pendingSuggestionCount,
      });
    }
  );
};
