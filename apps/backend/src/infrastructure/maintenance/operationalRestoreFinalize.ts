import type { PrismaClient } from '../../../generated/prisma/client.js';
import { supersededFailedMaintenanceRunWhere } from './maintenanceSupersededRuns.js';
import {
  IN_PROGRESS_BACKUP_STATUSES,
  IN_PROGRESS_RESTORE_STATUSES,
} from './maintenanceModeService.js';

export { RESTORE_SUPERSEDED_RUN_MESSAGE } from './maintenanceSupersededRuns.js';

export type OperationalRestoreFinalizeResult = {
  sessionsDeleted: number;
  removedStaleBackupRuns: number;
  removedRestoreRuns: number;
};

/**
 * After a successful DR restore: invalidate all sessions (force re-login), remove stale in-progress
 * backup rows from the snapshot, and remove other restore runs (avoid misleading Failed history).
 */
export async function finalizeOperationalRestore(
  prisma: PrismaClient,
  restoreRunId: string
): Promise<OperationalRestoreFinalizeResult> {
  const [removedStaleBackupRuns, removedRestoreRuns, sessions] = await Promise.all([
    prisma.backupRun.deleteMany({
      where: { status: { in: [...IN_PROGRESS_BACKUP_STATUSES] } },
    }),
    prisma.restoreRun.deleteMany({
      where: {
        id: { not: restoreRunId },
        OR: [
          { status: { in: [...IN_PROGRESS_RESTORE_STATUSES] } },
          supersededFailedMaintenanceRunWhere(),
        ],
      },
    }),
    prisma.session.deleteMany({}),
  ]);

  return {
    sessionsDeleted: sessions.count,
    removedStaleBackupRuns: removedStaleBackupRuns.count,
    removedRestoreRuns: removedRestoreRuns.count,
  };
}
