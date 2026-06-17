import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import impersonationRoutes from './impersonation.routes.js';
import usersRoutes from './users.routes.js';
import organisationRoutes from './organisation.routes.js';
import jobsRoutes from './jobs.routes.js';
import backupsRoutes from './backups.routes.js';
import restoresRoutes from './restores.routes.js';

const adminRoutes: FastifyPluginAsync = (app: FastifyInstance) => {
  app.register(jobsRoutes);
  app.register(backupsRoutes);
  app.register(restoresRoutes);
  app.register(impersonationRoutes);
  app.register(usersRoutes);
  app.register(organisationRoutes);
  return Promise.resolve();
};

export default adminRoutes;
