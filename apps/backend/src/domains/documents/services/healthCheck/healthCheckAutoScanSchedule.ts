import type { PrismaClient } from '../../../../../generated/prisma/client.js';
import { removeSchedule, upsertSchedule } from '../../../../infrastructure/jobs/client.js';
import { isHealthCheckAutoScanEnabled } from './healthCheckAutoScanService.js';

/** Default cron: daily 03:00 UTC. */
export const HEALTH_CHECK_AUTO_SCAN_DEFAULT_CRON = '0 3 * * *';

export const HEALTH_CHECK_AUTO_SCAN_SCHEDULE_KEY = 'default';

/**
 * Cron for auto-scan schedule.
 * Env `HEALTH_CHECK_AUTO_SCAN_CRON` when set (non-empty) overrides the documented default.
 */
export function getHealthCheckAutoScanCron(): string {
  const raw = process.env.HEALTH_CHECK_AUTO_SCAN_CRON?.trim();
  if (raw != null && raw.length > 0) return raw;
  return HEALTH_CHECK_AUTO_SCAN_DEFAULT_CRON;
}

/** Align pg-boss schedule with SystemSettings.healthCheckAutoScanEnabled. */
export async function syncHealthCheckAutoScanSchedule(enabled: boolean): Promise<void> {
  if (enabled) {
    await upsertSchedule({
      jobType: 'docs.health-check.auto-scan',
      cron: getHealthCheckAutoScanCron(),
      key: HEALTH_CHECK_AUTO_SCAN_SCHEDULE_KEY,
      payload: { reason: 'scheduled' },
    });
    return;
  }
  await removeSchedule('docs.health-check.auto-scan', HEALTH_CHECK_AUTO_SCAN_SCHEDULE_KEY);
}

/** Worker startup: re-read flag and reconcile schedule (deploy drift). */
export async function reconcileHealthCheckAutoScanSchedule(
  prisma: PrismaClient
): Promise<{ enabled: boolean }> {
  const enabled = await isHealthCheckAutoScanEnabled(prisma);
  await syncHealthCheckAutoScanSchedule(enabled);
  return { enabled };
}
