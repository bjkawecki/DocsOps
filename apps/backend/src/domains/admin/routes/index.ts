import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import {
  isAdminImpersonationEnabled,
  isPlatformResetEnabled,
} from '../../../config/runtimeMode.js';
import impersonationRoutes from './impersonation.routes.js';
import debugRoutes from './debug.routes.js';
import platformMigrationStatusRoutes from './platformMigrationStatus.routes.js';
import usersRoutes from './users.routes.js';
import organisationRoutes from './organisation.routes.js';
import jobsRoutes from './jobs.routes.js';
import backupsRoutes from './backups.routes.js';
import restoresRoutes from './restores.routes.js';
import platformExportsRoutes from './platformExports.routes.js';
import platformImportsRoutes from './platformImports.routes.js';
import notificationsRoutes from './notifications.routes.js';

const adminRoutes: FastifyPluginAsync = (app: FastifyInstance) => {
  app.register(jobsRoutes);
  app.register(backupsRoutes);
  app.register(restoresRoutes);
  app.register(platformExportsRoutes);
  app.register(platformImportsRoutes);
  app.register(platformMigrationStatusRoutes);
  app.register(notificationsRoutes);
  if (isAdminImpersonationEnabled()) {
    app.register(impersonationRoutes);
  }
  if (isPlatformResetEnabled()) {
    app.register(debugRoutes);
  }
  app.register(usersRoutes);
  app.register(organisationRoutes);
  return Promise.resolve();
};

export default adminRoutes;
