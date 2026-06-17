import type { FastifyReply, FastifyRequest } from 'fastify';
import { getMaintenanceLock, shouldBlockForMaintenance } from './maintenanceModeService.js';

let cachedLock: { at: number; info: Awaited<ReturnType<typeof getMaintenanceLock>> } | null = null;
const CACHE_MS = 1000;

async function getCachedMaintenanceLock(
  prisma: FastifyRequest['server']['prisma']
): Promise<Awaited<ReturnType<typeof getMaintenanceLock>>> {
  const now = Date.now();
  if (cachedLock && now - cachedLock.at < CACHE_MS) {
    return cachedLock.info;
  }
  const info = await getMaintenanceLock(prisma);
  cachedLock = { at: now, info };
  return info;
}

export function invalidateMaintenanceLockCache(): void {
  cachedLock = null;
}

export async function maintenanceModePreHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (!shouldBlockForMaintenance(request.method, request.url)) return;

  const lock = await getCachedMaintenanceLock(request.server.prisma);
  if (!lock.active) return;

  return reply.status(503).send({
    error: 'Maintenance in progress',
    reason: lock.reason ?? 'backup',
    code: 'MAINTENANCE_MODE',
  });
}
