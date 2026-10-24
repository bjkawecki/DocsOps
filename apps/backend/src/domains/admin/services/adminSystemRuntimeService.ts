import type { PrismaClient } from '../../../../generated/prisma/client.js';
import { isPgDumpCompatibleWithServer } from '../../../infrastructure/backup/pgDumpVersion.js';
import { resolveAppVersion } from '../../../infrastructure/appVersion.js';
import type { AdminSystemRuntime } from '../schemas/systemUpdate.js';
import { getAdminJobsHealth } from './adminJobsQueryService.js';
import { isMinioAvailableForBackup } from './operationalBackupService.js';

export async function readPostgresServerVersion(prisma: PrismaClient): Promise<string | null> {
  try {
    const rows = await prisma.$queryRaw<Array<{ server_version: string }>>`
      SELECT current_setting('server_version') AS server_version
    `;
    const version = rows[0]?.server_version?.trim();
    return version || null;
  } catch {
    return null;
  }
}

export async function readWorkerPgDumpVersion(prisma: PrismaClient): Promise<string | null> {
  try {
    const rows = await prisma.$queryRaw<Array<{ pg_dump_version: string | null }>>`
      SELECT pg_dump_version
      FROM worker_heartbeat
      ORDER BY heartbeat_at DESC
      LIMIT 1
    `;
    const version = rows[0]?.pg_dump_version?.trim();
    return version || null;
  } catch {
    return null;
  }
}

export async function getAdminSystemRuntime(prisma: PrismaClient): Promise<AdminSystemRuntime> {
  const [postgresVersion, health, minioAvailable, pgDumpVersion] = await Promise.all([
    readPostgresServerVersion(prisma),
    getAdminJobsHealth(prisma),
    isMinioAvailableForBackup(),
    readWorkerPgDumpVersion(prisma),
  ]);

  const effectivePgDumpVersion = health.workerConnected ? pgDumpVersion : null;

  return {
    installedVersion: resolveAppVersion(),
    postgresVersion,
    pgDumpVersion: effectivePgDumpVersion,
    pgDumpCompatible: isPgDumpCompatibleWithServer(postgresVersion, effectivePgDumpVersion),
    workerConnected: health.workerConnected,
    minioAvailable,
  };
}
