import type { PrismaClient } from '../../../../generated/prisma/client.js';
import { basename } from 'node:path';
import type { Readable } from 'node:stream';
import {
  IN_PROGRESS_PLATFORM_EXPORT_STATUSES,
  assertMaintenanceAvailable,
} from '../../../infrastructure/maintenance/maintenanceModeService.js';
import { isPlatformExportRunActivelyRunning } from '../../../infrastructure/maintenance/maintenanceRunActivity.js';
import { cancelJob } from '../../../infrastructure/jobs/client.js';
import { initStorage } from '../../../infrastructure/storage/index.js';
import { enqueueJob } from '../../../infrastructure/jobs/client.js';
import { isMinioAvailableForPlatformMigration } from './platformExportService.js';

function serializeExportRun(run: {
  id: string;
  status: string;
  triggeredByUserId: string | null;
  archiveSha256: string | null;
  sizeBytes: bigint | null;
  localObjectKey: string | null;
  errorMessage: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  createdAt: Date;
  manifestJson: unknown;
}) {
  return {
    id: run.id,
    status: run.status,
    triggeredByUserId: run.triggeredByUserId,
    archiveSha256: run.archiveSha256,
    sizeBytes: run.sizeBytes != null ? Number(run.sizeBytes) : null,
    localObjectKey: run.localObjectKey,
    errorMessage: run.errorMessage,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt,
    createdAt: run.createdAt,
    manifestJson: run.manifestJson,
  };
}

export async function listPlatformExportRuns(
  prisma: PrismaClient,
  query: { limit: number; offset: number; status?: string }
) {
  const where = query.status ? { status: query.status as never } : undefined;
  const [items, total] = await Promise.all([
    prisma.platformExportRun.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: query.limit,
      skip: query.offset,
    }),
    prisma.platformExportRun.count({ where }),
  ]);
  return {
    items: items.map(serializeExportRun),
    total,
    limit: query.limit,
    offset: query.offset,
  };
}

export async function getPlatformExportRun(prisma: PrismaClient, id: string) {
  const run = await prisma.platformExportRun.findUnique({ where: { id } });
  if (!run) return null;
  return serializeExportRun(run);
}

export async function triggerPlatformExport(
  prisma: PrismaClient,
  args: { requestedByUserId: string }
) {
  const minioOk = await isMinioAvailableForPlatformMigration();
  if (!minioOk) {
    throw new Error('MinIO is not configured or unreachable');
  }
  await assertMaintenanceAvailable(prisma);

  const run = await prisma.platformExportRun.create({
    data: {
      status: 'queued',
      triggeredByUserId: args.requestedByUserId,
    },
  });

  const jobId = await enqueueJob('maintenance.platform-export', {
    platformExportRunId: run.id,
    requestedByUserId: args.requestedByUserId,
  });

  await prisma.platformExportRun.update({
    where: { id: run.id },
    data: { pgBossJobId: jobId },
  });

  return { platformExportRunId: run.id, jobId };
}

export async function getPlatformExportDownload(
  prisma: PrismaClient,
  id: string
): Promise<{ body: Readable; contentType: string; filename: string } | null> {
  const run = await prisma.platformExportRun.findUnique({ where: { id } });
  if (!run?.localObjectKey || run.status !== 'succeeded') return null;
  const storage = await initStorage();
  if (!storage) return null;
  const object = await storage.getObject(run.localObjectKey);
  if (!object) return null;
  return {
    body: object.Body,
    contentType: object.ContentType ?? 'application/zstd',
    filename: basename(run.localObjectKey),
  };
}

export async function deletePlatformExportRun(prisma: PrismaClient, id: string): Promise<boolean> {
  const run = await prisma.platformExportRun.findUnique({ where: { id } });
  if (!run) return false;

  const isInProgress = (IN_PROGRESS_PLATFORM_EXPORT_STATUSES as readonly string[]).includes(
    run.status
  );

  if (isInProgress) {
    if (await isPlatformExportRunActivelyRunning(prisma, run)) {
      throw new Error('Platform export is still in progress');
    }
    if (run.pgBossJobId) {
      await cancelJob('maintenance.platform-export', run.pgBossJobId).catch(() => undefined);
    }
  }

  if (run.localObjectKey) {
    const storage = await initStorage();
    if (storage) {
      await storage.deleteObject(run.localObjectKey).catch(() => undefined);
    }
  }

  await prisma.platformExportRun.delete({ where: { id } });
  return true;
}
