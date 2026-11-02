import type { PrismaClient } from '../../../generated/prisma/client.js';
import { getJobById } from '../jobs/client.js';

const MAINTENANCE_LOCK_ID = 'backup';

export const ACTIVE_PG_BOSS_JOB_STATES = new Set(['active', 'retry', 'created']);

type MaintenanceActivityDb = Pick<PrismaClient, 'systemMaintenanceLock'>;

async function lockHeldForRun(
  prisma: MaintenanceActivityDb,
  args: { reason: 'backup' | 'restore' | 'platform-import'; runId: string }
): Promise<boolean> {
  const row = await prisma.systemMaintenanceLock.findUnique({ where: { id: MAINTENANCE_LOCK_ID } });
  if (!row || row.reason !== args.reason) return false;
  if (args.reason === 'backup') return row.backupRunId === args.runId;
  if (args.reason === 'restore') return row.restoreRunId === args.runId;
  return row.platformImportRunId === args.runId;
}

async function pgBossJobActive(
  jobType:
    | 'maintenance.backup'
    | 'maintenance.restore'
    | 'maintenance.platform-export'
    | 'maintenance.platform-import',
  jobId: string
) {
  const job = await getJobById(jobType, jobId).catch(() => null);
  return job != null && ACTIVE_PG_BOSS_JOB_STATES.has(job.state);
}

/** True when the backup worker or lock indicates this run is executing – not a stale DB row. */
export async function isBackupRunActivelyRunning(
  prisma: MaintenanceActivityDb,
  run: { id: string; pgBossJobId: string | null }
): Promise<boolean> {
  if (await lockHeldForRun(prisma, { reason: 'backup', runId: run.id })) return true;
  if (!run.pgBossJobId) return false;
  return pgBossJobActive('maintenance.backup', run.pgBossJobId);
}

/** True when the restore worker or lock indicates this run is executing – not a stale DB row. */
export async function isRestoreRunActivelyRunning(
  prisma: MaintenanceActivityDb,
  run: { id: string; pgBossJobId: string | null }
): Promise<boolean> {
  if (await lockHeldForRun(prisma, { reason: 'restore', runId: run.id })) return true;
  if (!run.pgBossJobId) return false;
  return pgBossJobActive('maintenance.restore', run.pgBossJobId);
}

export async function isPlatformExportRunActivelyRunning(
  prisma: MaintenanceActivityDb,
  run: { id: string; pgBossJobId: string | null }
): Promise<boolean> {
  if (!run.pgBossJobId) return false;
  return pgBossJobActive('maintenance.platform-export', run.pgBossJobId);
}

export async function isPlatformImportRunActivelyRunning(
  prisma: MaintenanceActivityDb,
  run: { id: string; pgBossJobId: string | null }
): Promise<boolean> {
  if (await lockHeldForRun(prisma, { reason: 'platform-import', runId: run.id })) return true;
  if (!run.pgBossJobId) return false;
  return pgBossJobActive('maintenance.platform-import', run.pgBossJobId);
}
