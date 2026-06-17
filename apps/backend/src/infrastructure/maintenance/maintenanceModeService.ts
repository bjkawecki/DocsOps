import type { PrismaClient } from '../../../generated/prisma/client.js';

const MAINTENANCE_LOCK_ID = 'backup';

export type MaintenanceLockInfo = {
  active: boolean;
  reason?: string;
  backupRunId?: string | null;
  restoreRunId?: string | null;
  lockedAt?: Date;
};

export async function getMaintenanceLock(prisma: PrismaClient): Promise<MaintenanceLockInfo> {
  const row = await prisma.systemMaintenanceLock.findUnique({ where: { id: MAINTENANCE_LOCK_ID } });
  if (!row) return { active: false };
  return {
    active: true,
    reason: row.reason,
    backupRunId: row.backupRunId,
    restoreRunId: row.restoreRunId,
    lockedAt: row.lockedAt,
  };
}

export async function assertMaintenanceAvailable(prisma: PrismaClient): Promise<void> {
  const lock = await getMaintenanceLock(prisma);
  if (lock.active) {
    throw new Error(
      lock.reason === 'restore'
        ? 'A restore is already in progress'
        : 'A backup is already in progress'
    );
  }
}

export async function acquireBackupMaintenanceLock(
  prisma: PrismaClient,
  backupRunId: string
): Promise<void> {
  await prisma.systemMaintenanceLock.upsert({
    where: { id: MAINTENANCE_LOCK_ID },
    create: {
      id: MAINTENANCE_LOCK_ID,
      reason: 'backup',
      backupRunId,
      restoreRunId: null,
    },
    update: {
      reason: 'backup',
      backupRunId,
      restoreRunId: null,
      lockedAt: new Date(),
    },
  });
}

export async function acquireRestoreMaintenanceLock(
  prisma: PrismaClient,
  restoreRunId: string
): Promise<void> {
  await prisma.systemMaintenanceLock.upsert({
    where: { id: MAINTENANCE_LOCK_ID },
    create: {
      id: MAINTENANCE_LOCK_ID,
      reason: 'restore',
      restoreRunId,
      backupRunId: null,
    },
    update: {
      reason: 'restore',
      restoreRunId,
      backupRunId: null,
      lockedAt: new Date(),
    },
  });
}

export async function releaseMaintenanceLock(prisma: PrismaClient): Promise<void> {
  await prisma.systemMaintenanceLock.deleteMany({ where: { id: MAINTENANCE_LOCK_ID } });
}

/** @deprecated Use releaseMaintenanceLock */
export async function releaseBackupMaintenanceLock(prisma: PrismaClient): Promise<void> {
  await releaseMaintenanceLock(prisma);
}

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/** Paths that may mutate during backup/restore maintenance (admin control plane). */
function isMaintenanceExemptPath(url: string): boolean {
  const path = url.split('?')[0] ?? url;
  if (path === '/api/v1/auth/login' || path === '/api/v1/auth/logout') return true;
  if (path.startsWith('/api/v1/admin/backups')) return true;
  if (path.startsWith('/api/v1/admin/backup-destinations')) return true;
  if (path.startsWith('/api/v1/admin/restores')) return true;
  return false;
}

export function shouldBlockForMaintenance(method: string, url: string): boolean {
  if (!MUTATING_METHODS.has(method.toUpperCase())) return false;
  if (isMaintenanceExemptPath(url)) return false;
  return true;
}
