import { createWriteStream } from 'node:fs';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import type { PrismaClient } from '../../../../generated/prisma/client.js';
import { invalidateMaintenanceLockCache } from '../../../infrastructure/maintenance/maintenancePreHandler.js';
import {
  releaseMaintenanceLockIfOwned,
  tryAcquireMaintenanceLock,
} from '../../../infrastructure/maintenance/maintenanceModeService.js';
import { initStorage } from '../../../infrastructure/storage/index.js';
import { extractZstdTarArchive } from '../../../infrastructure/backup/archiveExtract.js';
import { enqueueJob } from '../../../infrastructure/jobs/client.js';
import type { JobPayloadByType } from '../../../infrastructure/jobs/jobTypes.js';
import { appVersion } from '../../../infrastructure/appVersion.js';
import { importDomainDataFromDirectory } from './platformMigration/importDomainData.js';
import {
  capturePreImportUserSnapshots,
  rollbackFailedPlatformImport,
} from './platformMigration/platformDomainDataCleanup.js';
import {
  runPlatformImportPreflight,
  type PlatformImportPreflightResult,
} from './platformMigration/platformImportPreflight.js';

export type JobLogger = {
  info: (obj: unknown, msg?: string) => void;
  warn: (obj: unknown, msg?: string) => void;
  error: (obj: unknown, msg?: string) => void;
};

const PLATFORM_IMPORT_UPLOAD_MAX_BYTES = 2 * 1024 * 1024 * 1024;

export function getPlatformImportUploadMaxBytes(): number {
  const raw = process.env.PLATFORM_IMPORT_UPLOAD_MAX_BYTES;
  if (raw == null || raw.trim() === '') return PLATFORM_IMPORT_UPLOAD_MAX_BYTES;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) return PLATFORM_IMPORT_UPLOAD_MAX_BYTES;
  return n;
}

async function getStorageOrThrow() {
  const storage = await initStorage();
  if (!storage) throw new Error('MinIO is not configured or unreachable');
  const ok = await storage.isAvailable();
  if (!ok) throw new Error('MinIO bucket is not reachable');
  return storage;
}

async function notifyAdmins(
  prisma: PrismaClient,
  eventType: 'platform-import-succeeded' | 'platform-import-failed',
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
  platformImportRunId: string,
  error: unknown,
  logger: JobLogger
): Promise<void> {
  const message = error instanceof Error ? error.message : String(error);
  await prisma.platformImportRun.update({
    where: { id: platformImportRunId },
    data: {
      status: 'failed',
      errorMessage: message.slice(0, 2000),
      finishedAt: new Date(),
    },
  });
  logger.error({ platformImportRunId, error: message }, 'Platform import failed');
  await notifyAdmins(prisma, 'platform-import-failed', {
    platformImportRunId,
    errorMessage: message,
  });
}

export async function runPlatformImportPreflightOnBundle(
  prisma: PrismaClient,
  bundleDir: string
): Promise<PlatformImportPreflightResult> {
  return runPlatformImportPreflight(prisma, bundleDir);
}

export async function runPlatformImport(
  prisma: PrismaClient,
  payload: JobPayloadByType['maintenance.platform-import'],
  logger: JobLogger
): Promise<void> {
  const platformImportRunId = payload.platformImportRunId;
  let workDir: string | null = null;

  try {
    const storage = await getStorageOrThrow();
    const run = await prisma.platformImportRun.findUniqueOrThrow({
      where: { id: platformImportRunId },
    });
    if (!run.uploadObjectKey) {
      throw new Error('Upload object key is missing');
    }

    const transferPasswordHashes =
      payload.options.transferPasswordHashes === true &&
      run.preflightJson != null &&
      typeof run.preflightJson === 'object' &&
      (run.preflightJson as { sameAppVersion?: boolean }).sameAppVersion === true;

    await tryAcquireMaintenanceLock(prisma, {
      reason: 'platform-import',
      platformImportRunId,
    });
    invalidateMaintenanceLockCache();

    await prisma.platformImportRun.update({
      where: { id: platformImportRunId },
      data: { status: 'running', startedAt: new Date() },
    });

    workDir = await mkdtemp(join(tmpdir(), 'docsops-platform-import-'));
    const archivePath = join(workDir, 'archive.tar.zst');
    const bundleDir = join(workDir, 'bundle');

    const object = await storage.getObject(run.uploadObjectKey);
    if (!object) throw new Error('Upload archive not found in storage');
    await pipeline(object.Body, createWriteStream(archivePath));

    await mkdir(bundleDir, { recursive: true });
    await extractZstdTarArchive(archivePath, bundleDir);

    const preflight = await runPlatformImportPreflight(prisma, bundleDir);
    if (!preflight.ok) {
      throw new Error(preflight.errors.join('; ') || 'Preflight failed');
    }

    const preImportUsers = await capturePreImportUserSnapshots(prisma);
    let importStarted = false;

    try {
      importStarted = true;
      await importDomainDataFromDirectory(prisma, storage, {
        bundleDir,
        transferPasswordHashes,
        onPhase: async (status) => {
          await prisma.platformImportRun.update({
            where: { id: platformImportRunId },
            data: { status },
          });
        },
      });
    } catch (importError) {
      if (importStarted) {
        logger.warn(
          { platformImportRunId },
          'Platform import failed mid-run; rolling back imported domain data'
        );
        await rollbackFailedPlatformImport(prisma, storage, preImportUsers).catch(
          (rollbackError: unknown) => {
            logger.error(
              { platformImportRunId, error: rollbackError },
              'Platform import rollback failed'
            );
          }
        );
        await enqueueJob('search.reindex.full', { reason: 'manual' }).catch((err: unknown) => {
          logger.warn({ err }, 'Failed to enqueue search reindex after import rollback');
        });
      }
      throw importError;
    }

    await prisma.platformImportRun.update({
      where: { id: platformImportRunId },
      data: {
        status: 'succeeded',
        finishedAt: new Date(),
        errorMessage: null,
      },
    });

    await releaseMaintenanceLockIfOwned(prisma, {
      reason: 'platform-import',
      runId: platformImportRunId,
    });
    invalidateMaintenanceLockCache();

    await enqueueJob('search.reindex.full', { reason: 'manual' }).catch((err: unknown) => {
      logger.warn({ err }, 'Failed to enqueue search reindex after platform import');
    });

    await notifyAdmins(prisma, 'platform-import-succeeded', {
      platformImportRunId,
      documentCount: preflight.counts?.documents ?? null,
    });

    logger.info({ platformImportRunId }, 'Platform import completed');
  } catch (error) {
    await releaseMaintenanceLockIfOwned(prisma, {
      reason: 'platform-import',
      runId: platformImportRunId,
    }).catch(() => undefined);
    invalidateMaintenanceLockCache();
    await failRun(prisma, platformImportRunId, error, logger);
    throw error;
  } finally {
    if (workDir) {
      await rm(workDir, { recursive: true, force: true }).catch(() => undefined);
    }
  }
}

export async function uploadPlatformImportArchive(
  storage: NonNullable<Awaited<ReturnType<typeof initStorage>>>,
  filePath: string,
  platformImportRunId: string
): Promise<string> {
  const key = `platform-imports/uploads/${platformImportRunId}.tar.zst`;
  await storage.uploadFilePath(key, filePath, 'application/zstd');
  return key;
}

export function validateTransferPasswordHashesOption(
  transferPasswordHashes: boolean,
  preflight: PlatformImportPreflightResult
): boolean {
  if (!transferPasswordHashes) return false;
  if (!preflight.sameAppVersion) {
    throw new Error('Password hash transfer requires the same APP_VERSION on source and target');
  }
  return true;
}

export { appVersion };
