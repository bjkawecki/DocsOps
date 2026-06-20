import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Prisma, PrismaClient } from '../../../../generated/prisma/client.js';
import { invalidateMaintenanceLockCache } from '../../../infrastructure/maintenance/maintenancePreHandler.js';
import { initStorage } from '../../../infrastructure/storage/index.js';
import { buildZstdTarArchive } from '../../../infrastructure/backup/archiveBuilder.js';
import { enqueueJob } from '../../../infrastructure/jobs/client.js';
import type { JobPayloadByType } from '../../../infrastructure/jobs/jobTypes.js';
import {
  finalizePlatformManifestBundleSha,
  sha256File,
} from './platformMigration/platformManifest.js';
import { exportDomainDataToDirectory } from './platformMigration/exportDomainData.js';

export type JobLogger = {
  info: (obj: unknown, msg?: string) => void;
  warn: (obj: unknown, msg?: string) => void;
  error: (obj: unknown, msg?: string) => void;
};

async function getStorageOrThrow() {
  const storage = await initStorage();
  if (!storage) throw new Error('MinIO is not configured or unreachable');
  const ok = await storage.isAvailable();
  if (!ok) throw new Error('MinIO bucket is not reachable');
  return storage;
}

async function notifyAdmins(
  prisma: PrismaClient,
  eventType: 'platform-export-succeeded' | 'platform-export-failed',
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
  platformExportRunId: string,
  error: unknown,
  logger: JobLogger
): Promise<void> {
  const message = error instanceof Error ? error.message : String(error);
  await prisma.platformExportRun.update({
    where: { id: platformExportRunId },
    data: {
      status: 'failed',
      errorMessage: message.slice(0, 2000),
      finishedAt: new Date(),
    },
  });
  logger.error({ platformExportRunId, error: message }, 'Platform export failed');
  await notifyAdmins(prisma, 'platform-export-failed', {
    platformExportRunId,
    errorMessage: message,
  });
}

export async function isMinioAvailableForPlatformMigration(): Promise<boolean> {
  try {
    const storage = await initStorage();
    if (!storage) return false;
    return storage.isAvailable();
  } catch {
    return false;
  }
}

export async function runPlatformExport(
  prisma: PrismaClient,
  payload: JobPayloadByType['maintenance.platform-export'],
  logger: JobLogger
): Promise<void> {
  const platformExportRunId = payload.platformExportRunId;
  let workDir: string | null = null;

  try {
    const storage = await getStorageOrThrow();

    await prisma.platformExportRun.update({
      where: { id: platformExportRunId },
      data: { status: 'running', startedAt: new Date() },
    });
    invalidateMaintenanceLockCache();

    workDir = await mkdtemp(join(tmpdir(), 'docsops-platform-export-'));
    const bundleDir = join(workDir, 'bundle');
    await mkdir(bundleDir, { recursive: true });

    const { manifest } = await exportDomainDataToDirectory(prisma, storage, {
      bundleDir,
      platformExportRunId,
    });

    await prisma.platformExportRun.update({
      where: { id: platformExportRunId },
      data: { status: 'packaging' },
    });

    const archiveName = `docsops-platform-export-${platformExportRunId}-${Date.now()}.tar.zst`;
    const archivePath = join(workDir, archiveName);
    await buildZstdTarArchive(bundleDir, archivePath);
    await finalizePlatformManifestBundleSha(join(bundleDir, 'manifest.json'), archivePath);

    const archiveSha = await sha256File(archivePath);
    const archiveStat = await import('node:fs/promises').then((fs) => fs.stat(archivePath));

    const localKey = `platform-exports/${platformExportRunId}/${archiveName}`;
    await storage.uploadFilePath(localKey, archivePath, 'application/zstd');

    await prisma.platformExportRun.update({
      where: { id: platformExportRunId },
      data: {
        status: 'succeeded',
        archiveSha256: archiveSha,
        sizeBytes: BigInt(archiveStat.size),
        localObjectKey: localKey,
        manifestJson: manifest as Prisma.InputJsonValue,
        finishedAt: new Date(),
        errorMessage: null,
      },
    });

    await notifyAdmins(prisma, 'platform-export-succeeded', {
      platformExportRunId,
      sizeBytes: archiveStat.size,
      documentCount: manifest.counts.documents,
    });

    logger.info({ platformExportRunId, sizeBytes: archiveStat.size }, 'Platform export completed');
  } catch (error) {
    await failRun(prisma, platformExportRunId, error, logger);
    throw error;
  } finally {
    invalidateMaintenanceLockCache();
    if (workDir) {
      await rm(workDir, { recursive: true, force: true }).catch(() => undefined);
    }
  }
}
