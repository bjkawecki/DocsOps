import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { buildPgRestoreArgs } from './postgresBackupTargets.js';

const execFileAsync = promisify(execFile);

function wrapPgRestoreError(error: unknown): Error {
  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    (error as { code?: string }).code === 'ENOENT'
  ) {
    return new Error(
      'pg_restore not found. Rebuild the docsops-job-worker image (postgresql-client) or set PG_RESTORE_BIN.'
    );
  }
  if (error instanceof Error && 'stderr' in error) {
    const stderr = String((error as { stderr?: string }).stderr ?? '').trim();
    if (stderr) {
      return new Error(stderr.length > 2000 ? `${stderr.slice(0, 2000)}…` : stderr);
    }
  }
  return error instanceof Error ? error : new Error(String(error));
}

export async function runPostgresRestore(dumpPath: string): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl?.trim()) {
    throw new Error('DATABASE_URL is not configured');
  }
  try {
    await execFileAsync(
      process.env.PG_RESTORE_BIN?.trim() || 'pg_restore',
      buildPgRestoreArgs(dumpPath, databaseUrl),
      {
        timeout: 1_800_000,
        maxBuffer: 8 * 1024 * 1024,
        env: process.env,
      }
    );
  } catch (error) {
    throw wrapPgRestoreError(error);
  }
}
