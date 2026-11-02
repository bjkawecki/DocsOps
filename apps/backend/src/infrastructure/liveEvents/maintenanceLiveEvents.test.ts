import { describe, expect, it, vi, beforeEach } from 'vitest';
import { prisma } from '../../db.js';
import {
  publishMaintenanceStatusIfChanged,
  resetMaintenanceLiveEventCache,
} from './maintenanceLiveEvents.js';
import * as maintenanceModeService from '../maintenance/maintenanceModeService.js';
import * as liveEventNotify from './liveEventNotify.js';

describe('publishMaintenanceStatusIfChanged', () => {
  beforeEach(() => {
    resetMaintenanceLiveEventCache();
    vi.restoreAllMocks();
  });

  it('deduplicates identical status payloads', async () => {
    vi.spyOn(maintenanceModeService, 'getPublicMaintenanceStatus').mockResolvedValue({
      active: false,
    });
    const notifySpy = vi.spyOn(liveEventNotify, 'notifyLiveEvent').mockResolvedValue();

    const first = await publishMaintenanceStatusIfChanged(prisma);
    const second = await publishMaintenanceStatusIfChanged(prisma);

    expect(first).toBe(true);
    expect(second).toBe(false);
    expect(notifySpy).toHaveBeenCalledTimes(1);
  });

  it('notifies again when status changes', async () => {
    vi.spyOn(maintenanceModeService, 'getPublicMaintenanceStatus')
      .mockResolvedValueOnce({ active: true, reason: 'backup' })
      .mockResolvedValueOnce({ active: false });
    const notifySpy = vi.spyOn(liveEventNotify, 'notifyLiveEvent').mockResolvedValue();

    await publishMaintenanceStatusIfChanged(prisma);
    await publishMaintenanceStatusIfChanged(prisma);

    expect(notifySpy).toHaveBeenCalledTimes(2);
  });
});
