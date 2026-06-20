import type { Readable } from 'node:stream';
import { createWriteStream } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import type { PrismaClient } from '../../../../generated/prisma/client.js';
import {
  IN_PROGRESS_PLATFORM_IMPORT_STATUSES,
  assertMaintenanceAvailable,
} from '../../../infrastructure/maintenance/maintenanceModeService.js';
import { isPlatformImportRunActivelyRunning } from '../../../infrastructure/maintenance/maintenanceRunActivity.js';
import { initStorage } from '../../../infrastructure/storage/index.js';
import { enqueueJob, cancelJob } from '../../../infrastructure/jobs/client.js';
import { extractZstdTarArchive } from '../../../infrastructure/backup/archiveExtract.js';
import {
  getPlatformImportUploadMaxBytes,
  uploadPlatformImportArchive,
  validateTransferPasswordHashesOption,
} from './platformImportService.js';
import { runPlatformImportPreflight } from './platformMigration/platformImportPreflight.js';
import type { PlatformImportPreflightResult } from './platformMigration/platformImportPreflight.js';

function serializeImportRun(run: {
  id: string;
  status: string;
  source: string;
  uploadObjectKey: string | null;
  triggeredByUserId: string | null;
  preflightJson: unknown;
  optionsJson: unknown;
  errorMessage: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  createdAt: Date;
}) {
  return {
    id: run.id,
    status: run.status,
    source: run.source,
    uploadObjectKey: run.uploadObjectKey,
    triggeredByUserId: run.triggeredByUserId,
    preflightJson: run.preflightJson,
    optionsJson: run.optionsJson,
    errorMessage: run.errorMessage,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt,
    createdAt: run.createdAt,
  };
}

export function getPlatformImportUploadMaxBytesFromEnv(): number {
  return getPlatformImportUploadMaxBytes();
}

export async function listPlatformImportRuns(
  prisma: PrismaClient,
  query: { limit: number; offset: number }
) {
  const [items, total] = await Promise.all([
    prisma.platformImportRun.findMany({
      orderBy: { createdAt: 'desc' },
      take: query.limit,
      skip: query.offset,
    }),
    prisma.platformImportRun.count(),
  ]);
  return {
    items: items.map(serializeImportRun),
    total,
    limit: query.limit,
    offset: query.offset,
  };
}

export async function getPlatformImportRun(prisma: PrismaClient, id: string) {
  const run = await prisma.platformImportRun.findUnique({ where: { id } });
  if (!run) return null;
  return serializeImportRun(run);
}

export async function triggerPlatformImportUpload(
  prisma: PrismaClient,
  args: {
    fileStream: Readable;
    triggeredByUserId: string;
    filename: string;
  }
) {
  const filename = args.filename.trim();
  if (!filename.endsWith('.tar.zst')) {
    throw new Error('Upload must be a .tar.zst platform export archive');
  }

  const storage = await initStorage();
  if (!storage) throw new Error('MinIO is not configured or unreachable');
  const ok = await storage.isAvailable();
  if (!ok) throw new Error('MinIO bucket is not reachable');

  const run = await prisma.platformImportRun.create({
    data: {
      status: 'uploaded',
      triggeredByUserId: args.triggeredByUserId,
    },
  });

  const uploadObjectKey = `platform-imports/uploads/${run.id}.tar.zst`;
  const workDir = await mkdtemp(join(tmpdir(), 'docsops-platform-preflight-'));
  const archivePath = join(workDir, filename);
  const bundleDir = join(workDir, 'bundle');

  try {
    try {
      await pipeline(args.fileStream, createWriteStream(archivePath));
      await uploadPlatformImportArchive(storage, archivePath, run.id);

      await prisma.platformImportRun.update({
        where: { id: run.id },
        data: { uploadObjectKey },
      });

      await extractZstdTarArchive(archivePath, bundleDir);
      const preflight = await runPlatformImportPreflight(prisma, bundleDir);

      const status = preflight.ok ? 'awaiting_confirm' : 'preflight_failed';
      await prisma.platformImportRun.update({
        where: { id: run.id },
        data: {
          status,
          preflightJson: preflight,
          errorMessage: preflight.ok ? null : preflight.errors.join('; '),
        },
      });

      return {
        platformImportRunId: run.id,
        preflight,
        status,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await storage.deleteObject(uploadObjectKey).catch(() => undefined);
      await prisma.platformImportRun.update({
        where: { id: run.id },
        data: {
          status: 'preflight_failed',
          errorMessage: message,
        },
      });
      throw error;
    }
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => undefined);
  }
}

export async function runPlatformImportPreflightForRun(prisma: PrismaClient, id: string) {
  const run = await prisma.platformImportRun.findUnique({ where: { id } });
  if (!run?.uploadObjectKey) return null;

  const storage = await initStorage();
  if (!storage) throw new Error('MinIO is not configured or unreachable');

  const workDir = await mkdtemp(join(tmpdir(), 'docsops-platform-preflight-'));
  const archivePath = join(workDir, 'archive.tar.zst');
  const bundleDir = join(workDir, 'bundle');

  try {
    const object = await storage.getObject(run.uploadObjectKey);
    if (!object) throw new Error('Upload archive not found');
    await pipeline(object.Body, createWriteStream(archivePath));
    await extractZstdTarArchive(archivePath, bundleDir);
    const preflight = await runPlatformImportPreflight(prisma, bundleDir);

    const status = preflight.ok ? 'awaiting_confirm' : 'preflight_failed';
    await prisma.platformImportRun.update({
      where: { id },
      data: {
        status,
        preflightJson: preflight,
        errorMessage: preflight.ok ? null : preflight.errors.join('; '),
      },
    });

    return { preflight, status };
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => undefined);
  }
}

export async function confirmPlatformImport(
  prisma: PrismaClient,
  args: {
    platformImportRunId: string;
    triggeredByUserId: string;
    transferPasswordHashes?: boolean;
  }
) {
  await assertMaintenanceAvailable(prisma);

  const run = await prisma.platformImportRun.findUnique({
    where: { id: args.platformImportRunId },
  });
  if (!run) return null;
  if (run.status !== 'awaiting_confirm') {
    throw new Error('Import run is not ready for confirmation');
  }
  if (!run.uploadObjectKey) {
    throw new Error('Upload object key is missing');
  }

  const preflight =
    run.preflightJson != null && typeof run.preflightJson === 'object'
      ? (run.preflightJson as PlatformImportPreflightResult)
      : null;
  if (!preflight?.ok) {
    throw new Error('Preflight must succeed before import');
  }

  const transferPasswordHashes = validateTransferPasswordHashesOption(
    args.transferPasswordHashes === true,
    preflight
  );

  const options = { transferPasswordHashes };

  await prisma.platformImportRun.update({
    where: { id: run.id },
    data: {
      status: 'queued',
      optionsJson: options,
      triggeredByUserId: args.triggeredByUserId,
    },
  });

  const jobId = await enqueueJob('maintenance.platform-import', {
    platformImportRunId: run.id,
    source: 'upload',
    uploadObjectKey: run.uploadObjectKey,
    options,
  });

  await prisma.platformImportRun.update({
    where: { id: run.id },
    data: { pgBossJobId: jobId },
  });

  return { platformImportRunId: run.id, jobId };
}

export async function deletePlatformImportRun(prisma: PrismaClient, id: string): Promise<boolean> {
  const run = await prisma.platformImportRun.findUnique({ where: { id } });
  if (!run) return false;

  const isInProgress = (IN_PROGRESS_PLATFORM_IMPORT_STATUSES as readonly string[]).includes(
    run.status
  );
  if (isInProgress) {
    if (await isPlatformImportRunActivelyRunning(prisma, run)) {
      throw new Error('Platform import is still in progress');
    }
    if (run.pgBossJobId) {
      await cancelJob('maintenance.platform-import', run.pgBossJobId).catch(() => undefined);
    }
  }

  if (run.uploadObjectKey) {
    const storage = await initStorage();
    if (storage) {
      await storage.deleteObject(run.uploadObjectKey).catch(() => undefined);
    }
  }

  await prisma.platformImportRun.delete({ where: { id } });
  return true;
}
