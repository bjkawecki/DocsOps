import type { Readable } from 'node:stream';
import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import type { PrismaClient } from '../../../../generated/prisma/client.js';
import { extractZstdTarArchive } from '../../../infrastructure/backup/archiveExtract.js';
import type { StorageService } from '../../../infrastructure/storage/index.js';
import { uploadPlatformImportArchive } from './platformImportService.js';
import {
  runPlatformImportPreflight,
  type PlatformImportPreflightResult,
} from './platformMigration/platformImportPreflight.js';

export type PlatformImportPreflightStatus = 'awaiting_confirm' | 'preflight_failed';

/**
 * Writes the upload stream to disk, stores it in MinIO, extracts the bundle, and runs preflight.
 * Does not persist final preflight status (callers may combine that with other updates).
 */
export async function uploadExtractAndPreflightPlatformImport(
  prisma: PrismaClient,
  args: {
    storage: StorageService;
    runId: string;
    fileStream: Readable;
    archivePath: string;
    bundleDir: string;
    uploadObjectKey: string;
  }
): Promise<{
  preflight: PlatformImportPreflightResult;
  status: PlatformImportPreflightStatus;
}> {
  await pipeline(args.fileStream, createWriteStream(args.archivePath));
  await uploadPlatformImportArchive(args.storage, args.archivePath, args.runId);

  await prisma.platformImportRun.update({
    where: { id: args.runId },
    data: { uploadObjectKey: args.uploadObjectKey },
  });

  await extractZstdTarArchive(args.archivePath, args.bundleDir);
  const preflight = await runPlatformImportPreflight(prisma, args.bundleDir, {
    enforceEmpty: false,
  });
  const status: PlatformImportPreflightStatus = preflight.ok
    ? 'awaiting_confirm'
    : 'preflight_failed';

  return { preflight, status };
}

export function platformImportPreflightUpdateData(
  preflight: PlatformImportPreflightResult,
  status: PlatformImportPreflightStatus
) {
  return {
    status,
    preflightJson: preflight,
    errorMessage: preflight.ok ? null : preflight.errors.join('; '),
  };
}
