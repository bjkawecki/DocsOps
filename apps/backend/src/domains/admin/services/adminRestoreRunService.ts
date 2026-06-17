import type { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createWriteStream } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { PrismaClient } from '../../../../generated/prisma/client.js';
import { assertMaintenanceAvailable } from '../../../infrastructure/maintenance/maintenanceModeService.js';
import { initStorage } from '../../../infrastructure/storage/index.js';
import { enqueueJob } from '../../../infrastructure/jobs/client.js';
import { getRestoreUploadMaxBytes } from './operationalRestoreService.js';

const IN_PROGRESS_RESTORE_STATUSES = new Set([
  'queued',
  'running',
  'validating',
  'restoring_db',
  'restoring_minio',
]);

function serializeRestoreRun(run: {
  id: string;
  status: string;
  source: string;
  backupRunId: string | null;
  uploadObjectKey: string | null;
  triggeredByUserId: string | null;
  errorMessage: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  createdAt: Date;
  backupRun?: { id: string; createdAt: Date } | null;
}) {
  return {
    id: run.id,
    status: run.status,
    source: run.source,
    backupRunId: run.backupRunId,
    uploadObjectKey: run.uploadObjectKey,
    triggeredByUserId: run.triggeredByUserId,
    errorMessage: run.errorMessage,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt,
    createdAt: run.createdAt,
    backupRun: run.backupRun ? { id: run.backupRun.id, createdAt: run.backupRun.createdAt } : null,
  };
}

async function assertNoConcurrentRestore(prisma: PrismaClient): Promise<void> {
  const active = await prisma.restoreRun.findFirst({
    where: { status: { in: [...IN_PROGRESS_RESTORE_STATUSES] } },
    select: { id: true },
  });
  if (active) {
    throw new Error('Another restore is already in progress');
  }
}

async function enqueueRestoreJob(
  prisma: PrismaClient,
  args: {
    source: 'history' | 'upload';
    backupRunId?: string;
    uploadObjectKey?: string;
    triggeredByUserId: string;
  }
) {
  await assertMaintenanceAvailable(prisma);
  await assertNoConcurrentRestore(prisma);

  const run = await prisma.restoreRun.create({
    data: {
      status: 'queued',
      source: args.source,
      backupRunId: args.backupRunId ?? null,
      uploadObjectKey: args.uploadObjectKey ?? null,
      triggeredByUserId: args.triggeredByUserId,
    },
  });

  const jobId = await enqueueJob('maintenance.restore', {
    restoreRunId: run.id,
    source: args.source,
    backupRunId: args.backupRunId,
    uploadObjectKey: args.uploadObjectKey,
  });

  await prisma.restoreRun.update({
    where: { id: run.id },
    data: { pgBossJobId: jobId },
  });

  return { restoreRunId: run.id, jobId };
}

export async function listRestoreRuns(
  prisma: PrismaClient,
  query: { limit: number; offset: number }
) {
  const [items, total] = await Promise.all([
    prisma.restoreRun.findMany({
      orderBy: { createdAt: 'desc' },
      take: query.limit,
      skip: query.offset,
      include: {
        backupRun: { select: { id: true, createdAt: true } },
      },
    }),
    prisma.restoreRun.count(),
  ]);
  return {
    items: items.map(serializeRestoreRun),
    total,
    limit: query.limit,
    offset: query.offset,
  };
}

export async function getRestoreRun(prisma: PrismaClient, id: string) {
  const run = await prisma.restoreRun.findUnique({
    where: { id },
    include: {
      backupRun: { select: { id: true, createdAt: true } },
    },
  });
  if (!run) return null;
  return serializeRestoreRun(run);
}

export async function triggerRestoreFromBackup(
  prisma: PrismaClient,
  args: { backupRunId: string; triggeredByUserId: string }
) {
  const backupRun = await prisma.backupRun.findUnique({ where: { id: args.backupRunId } });
  if (!backupRun) return null;
  if (backupRun.status !== 'succeeded' || !backupRun.localObjectKey) {
    throw new Error('Backup run has no local archive copy available for restore');
  }

  return enqueueRestoreJob(prisma, {
    source: 'history',
    backupRunId: args.backupRunId,
    triggeredByUserId: args.triggeredByUserId,
  });
}

export async function triggerRestoreFromUpload(
  prisma: PrismaClient,
  args: { fileStream: Readable; triggeredByUserId: string; filename?: string }
) {
  const storage = await initStorage();
  if (!storage) {
    throw new Error('MinIO is not configured or unreachable');
  }
  const ok = await storage.isAvailable();
  if (!ok) {
    throw new Error('MinIO bucket is not reachable');
  }

  const name = args.filename?.trim() || 'upload.tar.zst';
  if (!name.endsWith('.tar.zst')) {
    throw new Error('Archive must be a .tar.zst file (docsops-backup-*.tar.zst)');
  }

  const workDir = await mkdtemp(join(tmpdir(), 'docsops-restore-upload-'));
  const localPath = join(workDir, name);
  try {
    await pipeline(args.fileStream, createWriteStream(localPath));
    const uploadObjectKey = `restore-uploads/${Date.now()}-${name}`;
    await storage.uploadFilePath(uploadObjectKey, localPath, 'application/zstd');
    return enqueueRestoreJob(prisma, {
      source: 'upload',
      uploadObjectKey,
      triggeredByUserId: args.triggeredByUserId,
    });
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => undefined);
  }
}

export { getRestoreUploadMaxBytes };
