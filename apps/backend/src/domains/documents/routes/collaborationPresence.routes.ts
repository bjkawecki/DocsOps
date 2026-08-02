import type { FastifyInstance } from 'fastify';
import {
  requireAuthPreHandler,
  preHandlerWrap,
  type RequestWithUser,
} from '../../auth/middleware.js';
import { requireDocumentAccess, canReadLeadDraft } from '../permissions/index.js';
import { routePrismaUserDocumentId } from './collaboration-route-helpers.js';
import { notifyDraftPresenceChanged } from '../services/collaboration/documentCollaborationLiveNotify.js';
import {
  listDraftEditorPresence,
  registerDraftEditorPresence,
  unregisterDraftEditorPresence,
} from '../services/collaboration/draftPresenceRegistry.js';

export const registerPresenceRoutes = (app: FastifyInstance): void => {
  /** POST draft presence heartbeat (edit mode). */
  app.post<{ Params: { documentId: string } }>(
    '/documents/:documentId/draft/presence',
    {
      preHandler: [requireAuthPreHandler, preHandlerWrap(requireDocumentAccess('readOrWrite'))],
    },
    async (request, reply) => {
      const { prisma, userId, documentId } = routePrismaUserDocumentId(request);
      const canReadLead = await canReadLeadDraft(prisma, userId, documentId);
      if (!canReadLead) {
        return reply.status(403).send({ error: 'No access to draft presence.' });
      }
      const user = (request as RequestWithUser).user;
      const name = user.name?.trim() || user.email || 'Unknown';
      registerDraftEditorPresence(documentId, userId, name);
      notifyDraftPresenceChanged(prisma, documentId, userId);
      return reply.status(204).send();
    }
  );

  /** DELETE draft presence (leave edit mode / unmount). */
  app.delete<{ Params: { documentId: string } }>(
    '/documents/:documentId/draft/presence',
    {
      preHandler: [requireAuthPreHandler, preHandlerWrap(requireDocumentAccess('readOrWrite'))],
    },
    async (request, reply) => {
      const { prisma, userId, documentId } = routePrismaUserDocumentId(request);
      const canReadLead = await canReadLeadDraft(prisma, userId, documentId);
      if (!canReadLead) {
        return reply.status(403).send({ error: 'No access to draft presence.' });
      }
      unregisterDraftEditorPresence(documentId, userId);
      notifyDraftPresenceChanged(prisma, documentId, userId);
      return reply.status(204).send();
    }
  );

  /** GET current draft editors (polling fallback). */
  app.get<{ Params: { documentId: string } }>(
    '/documents/:documentId/draft/presence',
    {
      preHandler: [requireAuthPreHandler, preHandlerWrap(requireDocumentAccess('readOrWrite'))],
    },
    async (request, reply) => {
      const { prisma, userId, documentId } = routePrismaUserDocumentId(request);
      const canReadLead = await canReadLeadDraft(prisma, userId, documentId);
      if (!canReadLead) {
        return reply.status(403).send({ error: 'No access to draft presence.' });
      }
      const editors = listDraftEditorPresence(documentId).map((e) => ({
        userId: e.userId,
        name: e.name,
      }));
      return reply.send({ documentId, editors });
    }
  );
};
