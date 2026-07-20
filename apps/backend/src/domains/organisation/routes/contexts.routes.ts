import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { registerProcessRoutes } from './contexts/processes.routes.js';
import { registerProjectRoutes } from './contexts/projects.routes.js';
import { registerSubcontextRoutes } from './contexts/subcontexts.routes.js';
import { registerContextByIdRoutes } from './contexts/context-by-id.routes.js';

const contextRoutes: FastifyPluginAsync = (app: FastifyInstance) => {
  registerContextByIdRoutes(app);
  registerProcessRoutes(app);
  registerProjectRoutes(app);
  registerSubcontextRoutes(app);
  return Promise.resolve();
};

export { contextRoutes };
