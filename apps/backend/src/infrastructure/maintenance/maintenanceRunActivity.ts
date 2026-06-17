import type { PrismaClient } from '../../../generated/prisma/client.js';
import { getJobById } from '../jobs/client.js';

const MAINTENANCE_LOCK_ID = 'backup';

export const ACTIVE_PG_BOSS_JOB_STATES = new Set(['active', 'retry', 'created']);

async function lockHeldForRun(
  prisma: PrismaClient,
  args: { reason: 'backup' | 'restore'; runId: string }
): Promise<boolean> {
  const row = await prisma.systemMaintenanceLock.findUnique({ where: { id: MAINTENANCE_LOCK_ID } });
  if (!row || row.reason !== args.reason) return false;
  if (args.reason === 'backup') return row.backupRunId === args.runId;
  return row.restoreRunId === args.runId;
}

async function pgBossJobActive(
  jobType: 'maintenance.backup' | 'maintenance.restore',
  jobId: string
) {
  const job = await getJobById(jobType, jobId).catch(() => null);
  return job != null && ACTIVE_PG_BOSS_JOB_STATES.has(job.state);
}

/** True when the backup worker or lock indicates this run is executing — not a stale DB row. */
export async function isBackupRunActivelyRunning(
  prisma: PrismaClient,
  run: { id: string; pgBossJobId: string | null }
): Promise<boolean> {
  if (await lockHeldForRun(prisma, { reason: 'backup', runId: run.id })) return true;
  if (!run.pgBossJobId) return false;
  return pgBossJobActive('maintenance.backup', run.pgBossJobId);
}

/** True when the restore worker or lock indicates this run is executing — not a stale DB row. */
export async function isRestoreRunActivelyRunning(
  prisma: PrismaClient,
  run: { id: string; pgBossJobId: string | null }
): Promise<boolean> {
  if (await lockHeldForRun(prisma, { reason: 'restore', runId: run.id })) return true;
  if (!run.pgBossJobId) return false;
  return pgBossJobActive('maintenance.restore', run.pgBossJobId);
}
