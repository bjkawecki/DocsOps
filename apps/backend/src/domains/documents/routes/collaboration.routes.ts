import type { FastifyInstance } from 'fastify';
import { registerLeadDraftRoutes } from './collaborationLeadDraft.routes.js';
import { registerSuggestionRoutes } from './collaborationSuggestions.routes.js';
import { registerPresenceRoutes } from './collaborationPresence.routes.js';
import { registerCommentRoutes } from './collaborationComments.routes.js';

export const registerCollaborationRoutes = (app: FastifyInstance): void => {
  registerLeadDraftRoutes(app);
  registerSuggestionRoutes(app);
  registerPresenceRoutes(app);
  registerCommentRoutes(app);
};
