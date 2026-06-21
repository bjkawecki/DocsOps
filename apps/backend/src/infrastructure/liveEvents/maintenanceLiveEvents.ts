import type { PrismaClient } from '../../../generated/prisma/client.js';
import {
  getPublicMaintenanceStatus,
  type PublicMaintenanceStatus,
} from '../maintenance/maintenanceModeService.js';
import { isLiveEventsEnabled } from './liveEventConfig.js';
import { notifyLiveEvent } from './liveEventNotify.js';

let lastPublishedStatus: PublicMaintenanceStatus | null = null;

function statusKey(status: PublicMaintenanceStatus): string {
  return JSON.stringify(status);
}

export function resetMaintenanceLiveEventCache(): void {
  lastPublishedStatus = null;
}

export async function publishMaintenanceStatusIfChanged(prisma: PrismaClient): Promise<boolean> {
  if (!isLiveEventsEnabled()) return false;

  const status = await getPublicMaintenanceStatus(prisma);
  const key = statusKey(status);
  if (lastPublishedStatus != null && statusKey(lastPublishedStatus) === key) {
    return false;
  }

  lastPublishedStatus = status;

  await notifyLiveEvent(prisma, {
    target: 'all',
    event: {
      v: 1,
      type: 'maintenance.status-changed',
      payload: status,
    },
  });

  return true;
}
