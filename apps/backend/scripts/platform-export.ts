/**
 * Offline platform export: writes a docsops-platform-export-*.tar.zst archive to --out.
 * Requires DATABASE_URL and MinIO (attachments). Does not use Admin HTTP.
 *
 * Usage:
 *   pnpm --filter backend platform:export -- --out /path/to/archive.tar.zst
 */
import { mkdir, mkdtemp, rm, copyFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import './load-env.js';
import { prisma } from '../src/db.js';
import { initStorage } from '../src/infrastructure/storage/index.js';
import { buildZstdTarArchive } from '../src/infrastructure/backup/archiveBuilder.js';
import {
  finalizePlatformManifestBundleSha,
  sha256File,
} from '../src/domains/admin/services/platformMigration/platformManifest.js';
import { exportDomainDataToDirectory } from '../src/domains/admin/services/platformMigration/exportDomainData.js';
import type { Prisma } from '../generated/prisma/client.js';

function parseArgs(argv: string[]): { out: string | null } {
  let out: string | null = null;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--out' || arg === '-o') {
      out = argv[i + 1] ?? null;
      i += 1;
    } else if (arg.startsWith('--out=')) {
      out = arg.slice('--out='.length);
    }
  }
  return { out };
}

async function main(): Promise<void> {
  const { out } = parseArgs(process.argv.slice(2));
  if (!out?.trim()) {
    console.error('Usage: platform:export -- --out /path/to/docsops-platform-export.tar.zst');
    process.exit(1);
  }
  const outPath = resolve(out.trim());
  if (!outPath.endsWith('.tar.zst')) {
    console.error('Error: --out must end with .tar.zst');
    process.exit(1);
  }

  const storage = await initStorage();
  if (!storage || !(await storage.isAvailable())) {
    console.error('Error: MinIO is not configured or unreachable');
    process.exit(1);
  }

  const run = await prisma.platformExportRun.create({
    data: { status: 'running', startedAt: new Date() },
  });

  let workDir: string | null = null;
  try {
    workDir = await mkdtemp(join(tmpdir(), 'docsops-cli-platform-export-'));
    const bundleDir = join(workDir, 'bundle');
    await mkdir(bundleDir, { recursive: true });

    const { manifest } = await exportDomainDataToDirectory(prisma, storage, {
      bundleDir,
      platformExportRunId: run.id,
    });

    const archiveName = `docsops-platform-export-${run.id}-${Date.now()}.tar.zst`;
    const archivePath = join(workDir, archiveName);
    await buildZstdTarArchive(bundleDir, archivePath);
    await finalizePlatformManifestBundleSha(join(bundleDir, 'manifest.json'), archivePath);

    const archiveSha = await sha256File(archivePath);
    const archiveStat = await stat(archivePath);

    await mkdir(dirname(outPath), { recursive: true });
    await copyFile(archivePath, outPath);

    await prisma.platformExportRun.update({
      where: { id: run.id },
      data: {
        status: 'succeeded',
        archiveSha256: archiveSha,
        sizeBytes: BigInt(archiveStat.size),
        localObjectKey: null,
        manifestJson: manifest as Prisma.InputJsonValue,
        finishedAt: new Date(),
        errorMessage: null,
      },
    });

    console.log(
      JSON.stringify(
        {
          ok: true,
          platformExportRunId: run.id,
          out: outPath,
          sizeBytes: archiveStat.size,
          archiveSha256: archiveSha,
          counts: manifest.counts,
        },
        null,
        2
      )
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await prisma.platformExportRun.update({
      where: { id: run.id },
      data: {
        status: 'failed',
        errorMessage: message.slice(0, 2000),
        finishedAt: new Date(),
      },
    });
    console.error('Platform export failed:', message);
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
