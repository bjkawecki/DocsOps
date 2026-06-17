import type { FastifyReply, FastifyRequest } from 'fastify';
import {
  getPublicMaintenanceStatus,
  shouldBlockForMaintenance,
  type PublicMaintenanceStatus,
} from './maintenanceModeService.js';

let cachedStatus: { at: number; info: PublicMaintenanceStatus } | null = null;
const CACHE_MS = 1000;

async function getCachedMaintenanceStatus(
  prisma: FastifyRequest['server']['prisma']
): Promise<PublicMaintenanceStatus> {
  const now = Date.now();
  if (cachedStatus && now - cachedStatus.at < CACHE_MS) {
    return cachedStatus.info;
  }
  const info = await getPublicMaintenanceStatus(prisma);
  cachedStatus = { at: now, info };
  return info;
}

export function invalidateMaintenanceLockCache(): void {
  cachedStatus = null;
}

export async function maintenanceModePreHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (!shouldBlockForMaintenance(request.method, request.url)) return;

  const status = await getCachedMaintenanceStatus(request.server.prisma);
  if (!status.active) return;

  return reply.status(503).send({
    error: 'Maintenance in progress',
    reason: status.reason ?? 'backup',
    code: 'MAINTENANCE_MODE',
  });
}
