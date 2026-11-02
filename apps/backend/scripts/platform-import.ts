/**
 * Offline platform import from a docsops-platform-export-*.tar.zst archive.
 * Requires DATABASE_URL and MinIO. Does not use Admin HTTP.
 *
 * Usage:
 *   pnpm --filter backend platform:import -- --archive /path/to/export.tar.zst --yes
 *   pnpm --filter backend platform:import -- --archive /path/to/export.tar.zst --yes --merge
 *   pnpm --filter backend platform:import -- --archive /path/to/export.tar.zst --yes --transfer-password-hashes
 */
import { createReadStream } from 'node:fs';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { createWriteStream } from 'node:fs';
import './load-env.js';
import { prisma } from '../src/db.js';
import { initStorage } from '../src/infrastructure/storage/index.js';
import { extractZstdTarArchive } from '../src/infrastructure/backup/archiveExtract.js';
import { refreshMaintenanceLiveState } from '../src/infrastructure/liveEvents/refreshMaintenanceLiveState.js';
import {
  releaseMaintenanceLockIfOwned,
  tryAcquireMaintenanceLock,
} from '../src/infrastructure/maintenance/maintenanceModeService.js';
import { enqueueJob } from '../src/infrastructure/jobs/client.js';
import { runPlatformImportPreflight } from '../src/domains/admin/services/platformMigration/platformImportPreflight.js';
import { importDomainDataFromDirectory } from '../src/domains/admin/services/platformMigration/importDomainData.js';
import {
  uploadPlatformImportArchive,
  validateTransferPasswordHashesOption,
} from '../src/domains/admin/services/platformImportService.js';

function parseArgs(argv: string[]): {
  archive: string | null;
  yes: boolean;
  merge: boolean;
  transferPasswordHashes: boolean;
} {
  let archive: string | null = null;
  let yes = false;
  let merge = false;
  let transferPasswordHashes = false;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--archive' || arg === '-a') {
      archive = argv[i + 1] ?? null;
      i += 1;
    } else if (arg.startsWith('--archive=')) {
      archive = arg.slice('--archive='.length);
    } else if (arg === '--yes' || arg === '-y') {
      yes = true;
    } else if (arg === '--merge') {
      merge = true;
    } else if (arg === '--transfer-password-hashes') {
      transferPasswordHashes = true;
    }
  }
  return { archive, yes, merge, transferPasswordHashes };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (!args.archive?.trim()) {
    console.error(
      'Usage: platform:import -- --archive /path/to/export.tar.zst --yes [--merge] [--transfer-password-hashes]'
    );
    process.exit(1);
  }
  if (!args.yes) {
    console.error('Error: refusing to import without --yes');
    process.exit(1);
  }

  const archivePath = resolve(args.archive.trim());
  if (!archivePath.endsWith('.tar.zst')) {
    console.error('Error: --archive must end with .tar.zst');
    process.exit(1);
  }

  const storage = await initStorage();
  if (!storage || !(await storage.isAvailable())) {
    console.error('Error: MinIO is not configured or unreachable');
    process.exit(1);
  }

  const run = await prisma.platformImportRun.create({
    data: {
      status: 'uploaded',
      source: 'upload',
    },
  });

  let workDir: string | null = null;
  try {
    workDir = await mkdtemp(join(tmpdir(), 'docsops-cli-platform-import-'));
    const stagedArchive = join(workDir, 'archive.tar.zst');
    const bundleDir = join(workDir, 'bundle');
    await pipeline(createReadStream(archivePath), createWriteStream(stagedArchive));
    const uploadObjectKey = await uploadPlatformImportArchive(storage, stagedArchive, run.id);

    await mkdir(bundleDir, { recursive: true });
    await extractZstdTarArchive(stagedArchive, bundleDir);

    const preflight = await runPlatformImportPreflight(prisma, bundleDir, {
      merge: args.merge,
    });
    await prisma.platformImportRun.update({
      where: { id: run.id },
      data: {
        uploadObjectKey,
        preflightJson: preflight,
        status: preflight.ok ? 'awaiting_confirm' : 'preflight_failed',
        errorMessage: preflight.ok ? null : preflight.errors.join('; '),
        optionsJson: {
          merge: args.merge,
          transferPasswordHashes: args.transferPasswordHashes,
        },
      },
    });

    if (!preflight.ok) {
      console.error('Preflight failed:');
      for (const err of preflight.errors) console.error(`  - ${err}`);
      process.exit(1);
    }

    for (const warning of preflight.warnings) {
      console.warn(`Warning: ${warning}`);
    }

    const transferPasswordHashes = validateTransferPasswordHashesOption(
      args.transferPasswordHashes,
      preflight
    );

    await tryAcquireMaintenanceLock(prisma, {
      reason: 'platform-import',
      platformImportRunId: run.id,
    });
    await refreshMaintenanceLiveState(prisma);

    await prisma.platformImportRun.update({
      where: { id: run.id },
      data: { status: 'running', startedAt: new Date() },
    });

    const { mergeStats } = await importDomainDataFromDirectory(prisma, storage, {
      bundleDir,
      transferPasswordHashes,
      merge: args.merge,
      onPhase: async (status) => {
        await prisma.platformImportRun.update({
          where: { id: run.id },
          data: { status },
        });
        console.log(`Phase: ${status}`);
      },
    });

    await prisma.platformImportRun.update({
      where: { id: run.id },
      data: {
        status: 'succeeded',
        finishedAt: new Date(),
        errorMessage: null,
        optionsJson: {
          merge: args.merge,
          transferPasswordHashes,
          mergeStats,
        },
      },
    });

    await releaseMaintenanceLockIfOwned(prisma, {
      reason: 'platform-import',
      runId: run.id,
    });
    await refreshMaintenanceLiveState(prisma);

    await enqueueJob('search.reindex.full', { reason: 'manual' }).catch((err: unknown) => {
      console.warn('Failed to enqueue search reindex:', err);
    });

    console.log(
      JSON.stringify(
        {
          ok: true,
          platformImportRunId: run.id,
          merge: args.merge,
          mergeStats,
          counts: preflight.counts,
        },
        null,
        2
      )
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await releaseMaintenanceLockIfOwned(prisma, {
      reason: 'platform-import',
      runId: run.id,
    }).catch(() => undefined);
    await refreshMaintenanceLiveState(prisma).catch(() => undefined);
    await prisma.platformImportRun.update({
      where: { id: run.id },
      data: {
        status: 'failed',
        errorMessage: message.slice(0, 2000),
        finishedAt: new Date(),
      },
    });
    console.error('Platform import failed:', message);
    process.exit(1);
  } finally {
    if (workDir) {
      await rm(workDir, { recursive: true, force: true }).catch(() => undefined);
    }
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
