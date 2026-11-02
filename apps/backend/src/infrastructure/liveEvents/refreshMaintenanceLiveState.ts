import type { PrismaClient } from '../../../generated/prisma/client.js';
import { invalidateMaintenanceLockCache } from '../maintenance/maintenancePreHandler.js';
import { publishMaintenanceStatusIfChanged } from './maintenanceLiveEvents.js';

/** Invalidate maintenance cache and push SSE when public status changed. */
export async function refreshMaintenanceLiveState(prisma: PrismaClient): Promise<void> {
  invalidateMaintenanceLockCache();
  await publishMaintenanceStatusIfChanged(prisma);
}
