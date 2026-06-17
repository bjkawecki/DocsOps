import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export async function runPostgresDump(outputPath: string): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl?.trim()) {
    throw new Error('DATABASE_URL is not configured');
  }
  await execFileAsync(
    process.env.PG_DUMP_BIN?.trim() || 'pg_dump',
    ['-Fc', '-f', outputPath, '--dbname', databaseUrl],
    {
      timeout: 600_000,
      maxBuffer: 4 * 1024 * 1024,
      env: process.env,
    }
  );
}
