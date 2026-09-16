import { createHash, randomBytes } from 'node:crypto';
import type { Readable } from 'node:stream';
import { createWriteStream } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import type { PrismaClient } from '../../../../generated/prisma/client.js';
import { assertDemoMutationsAllowed } from '../../../config/demoModeGuard.js';
import { extractZstdTarArchive } from '../../../infrastructure/backup/archiveExtract.js';
import { initStorage } from '../../../infrastructure/storage/index.js';
import { runPlatformImportPreflight } from './platformMigration/platformImportPreflight.js';
import { uploadPlatformImportArchive } from './platformImportService.js';

export const PLATFORM_IMPORT_RECEIVE_SLOT_TTL_MS = 60 * 60 * 1000;
export const PLATFORM_IMPORT_RECEIVE_PATH_PREFIX = '/api/v1/platform-import-receive/';

export class PlatformImportReceiveSlotError extends Error {
  constructor(
    message: string,
    readonly statusCode: number
  ) {
    super(message);
    this.name = 'PlatformImportReceiveSlotError';
  }
}

export function hashPlatformImportReceiveToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

function serializeSlot(slot: {
  id: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdByUserId: string;
  platformImportRunId: string | null;
  createdAt: Date;
}) {
  return {
    id: slot.id,
    expiresAt: slot.expiresAt.toISOString(),
    usedAt: slot.usedAt?.toISOString() ?? null,
    createdByUserId: slot.createdByUserId,
    platformImportRunId: slot.platformImportRunId,
    createdAt: slot.createdAt.toISOString(),
    open: slot.usedAt == null && slot.expiresAt > new Date(),
  };
}

async function assertTargetInstanceEmpty(prisma: PrismaClient): Promise<void> {
  const [companyCount, documentCount] = await Promise.all([
    prisma.company.count(),
    prisma.document.count(),
  ]);
  if (companyCount > 0 || documentCount > 0) {
    throw new PlatformImportReceiveSlotError(
      'Target instance is not empty. Platform import requires an empty instance (no companies or documents).',
      409
    );
  }
}

/** Revoke unused open slots, then create a new single-use receive slot. */
export async function createPlatformImportReceiveSlot(
  prisma: PrismaClient,
  args: { createdByUserId: string }
) {
  assertDemoMutationsAllowed();
  await assertTargetInstanceEmpty(prisma);

  await prisma.platformImportReceiveSlot.deleteMany({
    where: { usedAt: null },
  });

  const now = new Date();
  const token = randomBytes(32).toString('base64url');
  const tokenHash = hashPlatformImportReceiveToken(token);
  const expiresAt = new Date(now.getTime() + PLATFORM_IMPORT_RECEIVE_SLOT_TTL_MS);

  const slot = await prisma.platformImportReceiveSlot.create({
    data: {
      tokenHash,
      expiresAt,
      createdByUserId: args.createdByUserId,
    },
  });

  return {
    ...serializeSlot(slot),
    token,
    path: `${PLATFORM_IMPORT_RECEIVE_PATH_PREFIX}${token}`,
  };
}

export async function getActivePlatformImportReceiveSlot(prisma: PrismaClient) {
  const now = new Date();
  const slot = await prisma.platformImportReceiveSlot.findFirst({
    where: {
      usedAt: null,
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: 'desc' },
  });
  return slot ? serializeSlot(slot) : null;
}

export async function revokePlatformImportReceiveSlot(
  prisma: PrismaClient,
  id: string
): Promise<boolean> {
  assertDemoMutationsAllowed();
  const slot = await prisma.platformImportReceiveSlot.findUnique({ where: { id } });
  if (!slot) return false;
  if (slot.usedAt != null) {
    throw new PlatformImportReceiveSlotError('Receive slot was already used', 409);
  }
  await prisma.platformImportReceiveSlot.delete({ where: { id } });
  return true;
}

/**
 * Accept a pushed platform export archive for a valid receive token.
 * Creates a PlatformImportRun (source=push) and runs preflight; does not start the import job.
 */
export async function receivePlatformImportPush(
  prisma: PrismaClient,
  args: { token: string; fileStream: Readable }
) {
  assertDemoMutationsAllowed();

  const token = args.token.trim();
  if (!token) {
    throw new PlatformImportReceiveSlotError('Missing receive token', 404);
  }

  const tokenHash = hashPlatformImportReceiveToken(token);
  const slot = await prisma.platformImportReceiveSlot.findUnique({ where: { tokenHash } });
  if (!slot) {
    throw new PlatformImportReceiveSlotError('Receive slot not found', 404);
  }
  if (slot.usedAt != null) {
    throw new PlatformImportReceiveSlotError('Receive slot was already used', 410);
  }
  if (slot.expiresAt <= new Date()) {
    throw new PlatformImportReceiveSlotError('Receive slot has expired', 410);
  }

  await assertTargetInstanceEmpty(prisma);

  const storage = await initStorage();
  if (!storage)
    throw new PlatformImportReceiveSlotError('MinIO is not configured or unreachable', 503);
  const ok = await storage.isAvailable();
  if (!ok) throw new PlatformImportReceiveSlotError('MinIO bucket is not reachable', 503);

  const run = await prisma.platformImportRun.create({
    data: {
      status: 'uploaded',
      source: 'push',
      triggeredByUserId: slot.createdByUserId,
    },
  });

  const uploadObjectKey = `platform-imports/uploads/${run.id}.tar.zst`;
  const workDir = await mkdtemp(join(tmpdir(), 'docsops-platform-push-'));
  const archivePath = join(workDir, 'push.tar.zst');
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
      const preflight = await runPlatformImportPreflight(prisma, bundleDir, {
        enforceEmpty: false,
      });
      const status = preflight.ok ? 'awaiting_confirm' : 'preflight_failed';

      await prisma.$transaction([
        prisma.platformImportRun.update({
          where: { id: run.id },
          data: {
            status,
            preflightJson: preflight,
            errorMessage: preflight.ok ? null : preflight.errors.join('; '),
          },
        }),
        prisma.platformImportReceiveSlot.update({
          where: { id: slot.id },
          data: {
            usedAt: new Date(),
            platformImportRunId: run.id,
          },
        }),
      ]);

      return {
        platformImportRunId: run.id,
        receiveSlotId: slot.id,
        preflight,
        status,
      };
    } catch (error) {
      await storage.deleteObject(uploadObjectKey).catch(() => undefined);
      await prisma.platformImportRun.update({
        where: { id: run.id },
        data: {
          status: 'preflight_failed',
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      });
      throw error;
    }
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => undefined);
  }
}
