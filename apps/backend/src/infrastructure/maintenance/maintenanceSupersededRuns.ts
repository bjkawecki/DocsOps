import type { PrismaClient } from '../../../generated/prisma/client.js';

export const RESTORE_SUPERSEDED_RUN_MESSAGE = 'Run was superseded by disaster recovery restore';

const SUPERSEDED_ERROR_FRAGMENT = 'superseded by disaster recovery restore';

export function isSupersededFailedMaintenanceRun(run: {
  status: string;
  errorMessage: string | null;
}): boolean {
  return (
    run.status === 'failed' && (run.errorMessage?.includes(SUPERSEDED_ERROR_FRAGMENT) ?? false)
  );
}

/** Prisma filter for legacy rows marked failed after DR restore cleanup. */
export function supersededFailedMaintenanceRunWhere() {
  return {
    status: 'failed' as const,
    errorMessage: { contains: SUPERSEDED_ERROR_FRAGMENT },
  };
}

export async function purgeSupersededFailedMaintenanceRuns(prisma: PrismaClient): Promise<{
  backupRuns: number;
  restoreRuns: number;
}> {
  const where = supersededFailedMaintenanceRunWhere();
  const [backupRuns, restoreRuns] = await Promise.all([
    prisma.backupRun.deleteMany({ where }),
    prisma.restoreRun.deleteMany({ where }),
  ]);
  return { backupRuns: backupRuns.count, restoreRuns: restoreRuns.count };
}
