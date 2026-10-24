import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { buildPgDumpArgs } from './postgresBackupTargets.js';

const execFileAsync = promisify(execFile);

/** Stable codes stored on BackupRun.errorMessage (UI maps via i18n). */
export const BACKUP_PG_DUMP_VERSION_MISMATCH = 'BACKUP_PG_DUMP_VERSION_MISMATCH';
export const BACKUP_PG_DUMP_NOT_FOUND = 'BACKUP_PG_DUMP_NOT_FOUND';
export const BACKUP_PG_DUMP_FAILED = 'BACKUP_PG_DUMP_FAILED';

function execErrorText(error: unknown): string {
  if (!error || typeof error !== 'object') return String(error);
  const e = error as { message?: string; stderr?: string | Buffer };
  const stderr =
    typeof e.stderr === 'string'
      ? e.stderr
      : Buffer.isBuffer(e.stderr)
        ? e.stderr.toString('utf8')
        : '';
  return `${e.message ?? ''}\n${stderr}`;
}

/**
 * Map pg_dump failures to stable codes. Never surface argv / DATABASE_URL (credentials).
 */
export function wrapPgDumpError(error: unknown): Error {
  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    (error as { code?: string }).code === 'ENOENT'
  ) {
    return new Error(BACKUP_PG_DUMP_NOT_FOUND, { cause: error });
  }
  const text = execErrorText(error);
  if (/server version mismatch|pg_dump version/i.test(text)) {
    return new Error(BACKUP_PG_DUMP_VERSION_MISMATCH, { cause: error });
  }
  return new Error(BACKUP_PG_DUMP_FAILED, { cause: error });
}

export async function runPostgresDump(outputPath: string): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl?.trim()) {
    throw new Error('DATABASE_URL is not configured');
  }
  try {
    await execFileAsync(
      process.env.PG_DUMP_BIN?.trim() || 'pg_dump',
      buildPgDumpArgs(outputPath, databaseUrl),
      {
        timeout: 600_000,
        maxBuffer: 4 * 1024 * 1024,
        env: process.env,
      }
    );
  } catch (error) {
    throw wrapPgDumpError(error);
  }
}
