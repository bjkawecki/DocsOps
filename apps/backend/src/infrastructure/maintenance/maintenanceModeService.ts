import type { PrismaClient } from '../../../generated/prisma/client.js';

const BACKUP_LOCK_ID = 'backup';

export type MaintenanceLockInfo = {
  active: boolean;
  reason?: string;
  backupRunId?: string | null;
  lockedAt?: Date;
};

export async function getMaintenanceLock(prisma: PrismaClient): Promise<MaintenanceLockInfo> {
  const row = await prisma.systemMaintenanceLock.findUnique({ where: { id: BACKUP_LOCK_ID } });
  if (!row) return { active: false };
  return {
    active: true,
    reason: row.reason,
    backupRunId: row.backupRunId,
    lockedAt: row.lockedAt,
  };
}

export async function acquireBackupMaintenanceLock(
  prisma: PrismaClient,
  backupRunId: string
): Promise<void> {
  await prisma.systemMaintenanceLock.upsert({
    where: { id: BACKUP_LOCK_ID },
    create: {
      id: BACKUP_LOCK_ID,
      reason: 'backup',
      backupRunId,
    },
    update: {
      reason: 'backup',
      backupRunId,
      lockedAt: new Date(),
    },
  });
}

export async function releaseBackupMaintenanceLock(prisma: PrismaClient): Promise<void> {
  await prisma.systemMaintenanceLock.deleteMany({ where: { id: BACKUP_LOCK_ID } });
}

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/** Paths that may mutate during backup maintenance (admin backup control plane). */
function isMaintenanceExemptPath(url: string): boolean {
  const path = url.split('?')[0] ?? url;
  if (path === '/api/v1/auth/login' || path === '/api/v1/auth/logout') return true;
  if (path.startsWith('/api/v1/admin/backups')) return true;
  if (path.startsWith('/api/v1/admin/backup-destinations')) return true;
  return false;
}

export function shouldBlockForMaintenance(method: string, url: string): boolean {
  if (!MUTATING_METHODS.has(method.toUpperCase())) return false;
  if (isMaintenanceExemptPath(url)) return false;
  return true;
}
