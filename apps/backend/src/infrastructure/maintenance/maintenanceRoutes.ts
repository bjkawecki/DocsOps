import type { FastifyInstance } from 'fastify';
import { getPublicMaintenanceStatus } from './maintenanceModeService.js';

export type { PublicMaintenanceStatus } from './maintenanceModeService.js';

export function maintenanceRoutes(app: FastifyInstance): void {
  app.get('/maintenance/status', async (request, reply) => {
    const status = await getPublicMaintenanceStatus(request.server.prisma);
    return reply.send(status);
  });
}
