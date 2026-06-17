import type { PrismaClient } from '../../../generated/prisma/client.js';
import {
  isBackupRunActivelyRunning,
  isRestoreRunActivelyRunning,
} from './maintenanceRunActivity.js';

const MAINTENANCE_LOCK_ID = 'backup';

export const IN_PROGRESS_BACKUP_STATUSES = ['queued', 'running', 'uploading'] as const;
export const IN_PROGRESS_RESTORE_STATUSES = [
  'queued',
  'running',
  'validating',
  'restoring_db',
  'restoring_minio',
] as const;

export type MaintenanceReason = 'backup' | 'restore';

export type MaintenanceLockInfo = {
  active: boolean;
  reason?: string;
  backupRunId?: string | null;
  restoreRunId?: string | null;
  lockedAt?: Date;
};

function lockBusyMessage(reason: string | undefined): string {
  return reason === 'restore'
    ? 'A restore is already in progress'
    : 'A backup is already in progress';
}

async function findConflictingMaintenanceRun(
  prisma: PrismaClient,
  args: { reason: MaintenanceReason; backupRunId?: string; restoreRunId?: string }
): Promise<void> {
  const [inProgressBackups, inProgressRestores] = await Promise.all([
    prisma.backupRun.findMany({
      where: { status: { in: [...IN_PROGRESS_BACKUP_STATUSES] } },
      select: { id: true, pgBossJobId: true },
    }),
    prisma.restoreRun.findMany({
      where: { status: { in: [...IN_PROGRESS_RESTORE_STATUSES] } },
      select: { id: true, pgBossJobId: true },
    }),
  ]);

  for (const backup of inProgressBackups) {
    if (backup.id === args.backupRunId) continue;
    if (await isBackupRunActivelyRunning(prisma, backup)) {
      throw new Error('A backup is already in progress');
    }
  }

  for (const restore of inProgressRestores) {
    if (restore.id === args.restoreRunId) continue;
    if (await isRestoreRunActivelyRunning(prisma, restore)) {
      throw new Error('A restore is already in progress');
    }
  }
}

export type PublicMaintenanceStatus = {
  active: boolean;
  reason?: 'backup' | 'restore';
};

export async function getPublicMaintenanceStatus(
  prisma: PrismaClient
): Promise<PublicMaintenanceStatus> {
  const lock = await getMaintenanceLock(prisma);
  if (lock.active) {
    return {
      active: true,
      reason: lock.reason === 'restore' ? 'restore' : 'backup',
    };
  }

  const [inProgressBackups, inProgressRestores] = await Promise.all([
    prisma.backupRun.findMany({
      where: { status: { in: [...IN_PROGRESS_BACKUP_STATUSES] } },
      select: { id: true, pgBossJobId: true },
    }),
    prisma.restoreRun.findMany({
      where: { status: { in: [...IN_PROGRESS_RESTORE_STATUSES] } },
      select: { id: true, pgBossJobId: true },
    }),
  ]);

  for (const restore of inProgressRestores) {
    if (await isRestoreRunActivelyRunning(prisma, restore)) {
      return { active: true, reason: 'restore' };
    }
  }
  for (const backup of inProgressBackups) {
    if (await isBackupRunActivelyRunning(prisma, backup)) {
      return { active: true, reason: 'backup' };
    }
  }

  return { active: false };
}

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
    throw new Error(lockBusyMessage(lock.reason));
  }
  await findConflictingMaintenanceRun(prisma, { reason: 'backup' });
}

/**
 * Atomically acquire the singleton maintenance lock. Fails if another backup or restore holds it
 * or if a conflicting run is already in progress (excluding the current run id when provided).
 */
export async function tryAcquireMaintenanceLock(
  prisma: PrismaClient,
  args: { reason: MaintenanceReason; backupRunId?: string; restoreRunId?: string }
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const existing = await tx.systemMaintenanceLock.findUnique({
      where: { id: MAINTENANCE_LOCK_ID },
    });
    if (existing) {
      throw new Error(lockBusyMessage(existing.reason));
    }

    await findConflictingMaintenanceRun(tx, args);

    await tx.systemMaintenanceLock.create({
      data: {
        id: MAINTENANCE_LOCK_ID,
        reason: args.reason,
        backupRunId: args.backupRunId ?? null,
        restoreRunId: args.restoreRunId ?? null,
      },
    });
  });
}

/** @deprecated Use tryAcquireMaintenanceLock */
export async function acquireBackupMaintenanceLock(
  prisma: PrismaClient,
  backupRunId: string
): Promise<void> {
  await tryAcquireMaintenanceLock(prisma, { reason: 'backup', backupRunId });
}

/** @deprecated Use tryAcquireMaintenanceLock */
export async function acquireRestoreMaintenanceLock(
  prisma: PrismaClient,
  restoreRunId: string
): Promise<void> {
  await tryAcquireMaintenanceLock(prisma, { reason: 'restore', restoreRunId });
}

export async function releaseMaintenanceLockIfOwned(
  prisma: PrismaClient,
  args: { reason: MaintenanceReason; runId: string }
): Promise<void> {
  await prisma.systemMaintenanceLock.deleteMany({
    where: {
      id: MAINTENANCE_LOCK_ID,
      reason: args.reason,
      ...(args.reason === 'backup' ? { backupRunId: args.runId } : { restoreRunId: args.runId }),
    },
  });
}

export async function releaseMaintenanceLock(prisma: PrismaClient): Promise<void> {
  await prisma.systemMaintenanceLock.deleteMany({ where: { id: MAINTENANCE_LOCK_ID } });
}

/** @deprecated Use releaseMaintenanceLockIfOwned */
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
