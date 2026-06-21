import { createWriteStream } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import type { PrismaClient, RestoreRunSource } from '../../../../generated/prisma/client.js';
import { refreshMaintenanceLiveState } from '../../../infrastructure/liveEvents/refreshMaintenanceLiveState.js';
import {
  releaseMaintenanceLockIfOwned,
  tryAcquireMaintenanceLock,
} from '../../../infrastructure/maintenance/maintenanceModeService.js';
import { extractZstdTarArchive } from '../../../infrastructure/backup/archiveExtract.js';
import { verifyBackupBundle } from '../../../infrastructure/backup/backupManifestVerify.js';
import { importMinioDirectoryToBucket } from '../../../infrastructure/backup/minioImport.js';
import { runPostgresRestore } from '../../../infrastructure/backup/postgresRestore.js';
import { finalizeOperationalRestore } from '../../../infrastructure/maintenance/operationalRestoreFinalize.js';
import { purgeSupersededFailedMaintenanceRuns } from '../../../infrastructure/maintenance/maintenanceSupersededRuns.js';
import { initStorage, type StorageService } from '../../../infrastructure/storage/index.js';
import { enqueueJob } from '../../../infrastructure/jobs/client.js';
import type { JobPayloadByType } from '../../../infrastructure/jobs/jobTypes.js';

export type JobLogger = {
  info: (obj: unknown, msg?: string) => void;
  warn: (obj: unknown, msg?: string) => void;
  error: (obj: unknown, msg?: string) => void;
};

type RestoreRunSnapshot = {
  id: string;
  source: RestoreRunSource;
  backupRunId: string | null;
  uploadObjectKey: string | null;
  triggeredByUserId: string | null;
  pgBossJobId: string | null;
  startedAt: Date | null;
};

/**
 * pg_restore replaces application tables from the archive, including volatile rows such as
 * SystemMaintenanceLock and the in-progress RestoreRun. Reclaim maintenance mode and run state
 * before continuing with MinIO import or reporting failure.
 */
async function reestablishRestoreControlPlane(
  prisma: PrismaClient,
  snapshot: RestoreRunSnapshot,
  status: 'restoring_minio' | 'failed',
  errorMessage?: string
): Promise<void> {
  await prisma.systemMaintenanceLock.deleteMany({ where: { id: 'backup' } });
  if (status !== 'failed') {
    await tryAcquireMaintenanceLock(prisma, { reason: 'restore', restoreRunId: snapshot.id });
  }
  await refreshMaintenanceLiveState(prisma);

  await prisma.restoreRun.upsert({
    where: { id: snapshot.id },
    create: {
      id: snapshot.id,
      status,
      source: snapshot.source,
      backupRunId: snapshot.backupRunId,
      uploadObjectKey: snapshot.uploadObjectKey,
      triggeredByUserId: snapshot.triggeredByUserId,
      pgBossJobId: snapshot.pgBossJobId,
      startedAt: snapshot.startedAt ?? new Date(),
      finishedAt: status === 'failed' ? new Date() : null,
      errorMessage: errorMessage?.slice(0, 2000) ?? null,
    },
    update: {
      status,
      errorMessage: status === 'failed' ? (errorMessage?.slice(0, 2000) ?? null) : null,
      finishedAt: status === 'failed' ? new Date() : null,
    },
  });
}

async function getStorageOrThrow(): Promise<StorageService> {
  const storage = await initStorage();
  if (!storage) throw new Error('MinIO is not configured or unreachable');
  const ok = await storage.isAvailable();
  if (!ok) throw new Error('MinIO bucket is not reachable');
  return storage;
}

async function notifyAdmins(
  prisma: PrismaClient,
  eventType: 'backup-restore-succeeded' | 'backup-restore-failed',
  payload: Record<string, unknown>
): Promise<void> {
  const admins = await prisma.user.findMany({
    where: { isAdmin: true, deletedAt: null },
    select: { id: true },
  });
  if (admins.length === 0) return;
  await enqueueJob('notifications.send', {
    eventType,
    targetUserIds: admins.map((a) => a.id),
    payload,
  });
}

async function failRun(
  prisma: PrismaClient,
  restoreRunId: string,
  error: unknown,
  logger: JobLogger,
  snapshot: RestoreRunSnapshot | null
): Promise<void> {
  const message = error instanceof Error ? error.message : String(error);
  if (snapshot) {
    await reestablishRestoreControlPlane(prisma, snapshot, 'failed', message);
  } else {
    await prisma.restoreRun
      .update({
        where: { id: restoreRunId },
        data: {
          status: 'failed',
          errorMessage: message.slice(0, 2000),
          finishedAt: new Date(),
        },
      })
      .catch(() => undefined);
  }
  logger.error({ restoreRunId, error: message }, 'Operational restore failed');
  await notifyAdmins(prisma, 'backup-restore-failed', { restoreRunId, errorMessage: message });
}

async function downloadArchiveToFile(
  storage: StorageService,
  objectKey: string,
  targetPath: string
): Promise<void> {
  const object = await storage.getObject(objectKey);
  if (!object?.Body) {
    throw new Error(`Backup archive not found in object storage (${objectKey})`);
  }
  await pipeline(object.Body, createWriteStream(targetPath));
}

export async function runOperationalRestore(
  prisma: PrismaClient,
  payload: JobPayloadByType['maintenance.restore'],
  logger: JobLogger
): Promise<void> {
  const { restoreRunId } = payload;
  let workDir: string | null = null;
  let uploadObjectKey: string | null = null;
  let runSnapshot: RestoreRunSnapshot | null = null;

  try {
    const run = await prisma.restoreRun.findUniqueOrThrow({ where: { id: restoreRunId } });
    uploadObjectKey = run.uploadObjectKey;
    runSnapshot = {
      id: run.id,
      source: run.source,
      backupRunId: run.backupRunId,
      uploadObjectKey: run.uploadObjectKey,
      triggeredByUserId: run.triggeredByUserId,
      pgBossJobId: run.pgBossJobId,
      startedAt: run.startedAt,
    };

    await tryAcquireMaintenanceLock(prisma, { reason: 'restore', restoreRunId });
    await refreshMaintenanceLiveState(prisma);

    await prisma.restoreRun.update({
      where: { id: restoreRunId },
      data: { status: 'running', startedAt: new Date() },
    });

    logger.info({ restoreRunId, source: payload.source }, 'Restore lock acquired, starting');

    const storage = await getStorageOrThrow();

    let archiveObjectKey: string;
    if (payload.source === 'history') {
      if (!payload.backupRunId) throw new Error('backupRunId is required for history restore');
      const backupRun = await prisma.backupRun.findUniqueOrThrow({
        where: { id: payload.backupRunId },
      });
      if (backupRun.status !== 'succeeded' || !backupRun.localObjectKey) {
        throw new Error('Backup run has no local archive copy');
      }
      archiveObjectKey = backupRun.localObjectKey;
    } else {
      if (!payload.uploadObjectKey)
        throw new Error('uploadObjectKey is required for upload restore');
      archiveObjectKey = payload.uploadObjectKey;
    }

    workDir = await mkdtemp(join(tmpdir(), 'docsops-restore-'));
    const archivePath = join(workDir, 'archive.tar.zst');
    const bundleDir = join(workDir, 'bundle');

    logger.info({ restoreRunId, archiveObjectKey }, 'Restore downloading archive');
    await downloadArchiveToFile(storage, archiveObjectKey, archivePath);
    logger.info({ restoreRunId }, 'Restore extracting archive');
    await extractZstdTarArchive(archivePath, bundleDir);

    await prisma.restoreRun.update({
      where: { id: restoreRunId },
      data: { status: 'validating' },
    });

    const { dumpPath, minioObjectsDir } = await verifyBackupBundle(bundleDir);

    await prisma.restoreRun.update({
      where: { id: restoreRunId },
      data: { status: 'restoring_db' },
    });
    logger.info({ restoreRunId }, 'Restore running pg_restore');
    await runPostgresRestore(dumpPath);

    await reestablishRestoreControlPlane(prisma, runSnapshot, 'restoring_minio');
    logger.info({ restoreRunId }, 'Restore control plane re-established after pg_restore');

    logger.info({ restoreRunId }, 'Restore importing MinIO objects');
    await importMinioDirectoryToBucket(storage, minioObjectsDir);

    await prisma.restoreRun.update({
      where: { id: restoreRunId },
      data: {
        status: 'succeeded',
        errorMessage: null,
        finishedAt: new Date(),
      },
    });

    const finalizeResult = await finalizeOperationalRestore(prisma, restoreRunId);

    await prisma.restoreRun.upsert({
      where: { id: restoreRunId },
      create: {
        id: runSnapshot.id,
        status: 'succeeded',
        source: runSnapshot.source,
        backupRunId: runSnapshot.backupRunId,
        uploadObjectKey: runSnapshot.uploadObjectKey,
        triggeredByUserId: runSnapshot.triggeredByUserId,
        pgBossJobId: runSnapshot.pgBossJobId,
        startedAt: runSnapshot.startedAt ?? new Date(),
        finishedAt: new Date(),
        errorMessage: null,
      },
      update: {
        status: 'succeeded',
        errorMessage: null,
        finishedAt: new Date(),
      },
    });

    await purgeSupersededFailedMaintenanceRuns(prisma);

    logger.info({ restoreRunId, ...finalizeResult }, 'Operational restore finalized');

    await enqueueJob('search.reindex.full', { reason: 'manual' as const }).catch(
      (error: unknown) => {
        logger.warn({ error, restoreRunId }, 'Failed to enqueue full reindex after restore');
      }
    );

    await notifyAdmins(prisma, 'backup-restore-succeeded', {
      restoreRunId,
      sessionsInvalidated: finalizeResult.sessionsDeleted,
    });
    logger.info({ restoreRunId }, 'Operational restore completed');
  } catch (error) {
    await failRun(prisma, restoreRunId, error, logger, runSnapshot);
    throw error;
  } finally {
    await releaseMaintenanceLockIfOwned(prisma, { reason: 'restore', runId: restoreRunId }).catch(
      () => undefined
    );
    await prisma.systemMaintenanceLock
      .deleteMany({ where: { id: 'backup', reason: 'backup' } })
      .catch(() => undefined);
    await refreshMaintenanceLiveState(prisma);
    if (workDir) {
      await rm(workDir, { recursive: true, force: true }).catch(() => undefined);
    }
    if (uploadObjectKey) {
      const storage = await initStorage();
      if (storage) {
        await storage.deleteObject(uploadObjectKey).catch(() => undefined);
      }
    }
  }
}

export function getRestoreUploadMaxBytes(): number {
  const raw = process.env.BACKUP_RESTORE_UPLOAD_MAX_BYTES?.trim();
  if (raw) {
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return 5 * 1024 * 1024 * 1024;
}
