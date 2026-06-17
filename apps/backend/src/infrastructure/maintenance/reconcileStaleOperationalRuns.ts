import type { PrismaClient } from '../../../generated/prisma/client.js';
import {
  IN_PROGRESS_BACKUP_STATUSES,
  IN_PROGRESS_RESTORE_STATUSES,
} from './maintenanceModeService.js';
import {
  isBackupRunActivelyRunning,
  isRestoreRunActivelyRunning,
} from './maintenanceRunActivity.js';

const STALE_AFTER_RESTORE_MESSAGE = 'Stale run record after disaster recovery restore';

/**
 * pg_restore replays BackupRun/RestoreRun rows from the archive, including in-progress states.
 * After a successful restore, mark non-active in-progress rows as failed so admin UI stays accurate.
 */
export async function reconcileStaleOperationalRunsAfterRestore(
  prisma: PrismaClient,
  args: { activeRestoreRunId: string }
): Promise<{ staleBackupRuns: number; staleRestoreRuns: number }> {
  let staleBackupRuns = 0;
  let staleRestoreRuns = 0;
  const finishedAt = new Date();

  const inProgressBackups = await prisma.backupRun.findMany({
    where: { status: { in: [...IN_PROGRESS_BACKUP_STATUSES] } },
    select: { id: true, pgBossJobId: true },
  });

  for (const run of inProgressBackups) {
    if (await isBackupRunActivelyRunning(prisma, run)) continue;
    await prisma.backupRun.update({
      where: { id: run.id },
      data: {
        status: 'failed',
        errorMessage: STALE_AFTER_RESTORE_MESSAGE,
        finishedAt,
      },
    });
    staleBackupRuns += 1;
  }

  const inProgressRestores = await prisma.restoreRun.findMany({
    where: {
      status: { in: [...IN_PROGRESS_RESTORE_STATUSES] },
      id: { not: args.activeRestoreRunId },
    },
    select: { id: true, pgBossJobId: true },
  });

  for (const run of inProgressRestores) {
    if (await isRestoreRunActivelyRunning(prisma, run)) continue;
    await prisma.restoreRun.update({
      where: { id: run.id },
      data: {
        status: 'failed',
        errorMessage: STALE_AFTER_RESTORE_MESSAGE,
        finishedAt,
      },
    });
    staleRestoreRuns += 1;
  }

  return { staleBackupRuns, staleRestoreRuns };
}
