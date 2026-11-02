import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

/** First major digit sequence (e.g. "18.4" → 18, "pg_dump (PostgreSQL) 15.19" → 15). */
export function parsePostgresMajor(version: string): number | null {
  const match = version.trim().match(/(\d+)/);
  if (!match) return null;
  const major = Number(match[1]);
  return Number.isFinite(major) ? major : null;
}

/** Normalize `pg_dump --version` stdout to a short version string. */
export function parsePgDumpVersionOutput(stdout: string): string | null {
  const match =
    stdout.match(/\(PostgreSQL\)\s*([\d.]+)/i) ?? stdout.trim().match(/^.*?([\d]+\.[\d.]+)/);
  return match?.[1] ?? null;
}

export function isPgDumpCompatibleWithServer(
  serverVersion: string | null | undefined,
  pgDumpVersion: string | null | undefined
): boolean | null {
  if (!serverVersion?.trim() || !pgDumpVersion?.trim()) return null;
  const serverMajor = parsePostgresMajor(serverVersion);
  const dumpMajor = parsePostgresMajor(pgDumpVersion);
  if (serverMajor == null || dumpMajor == null) return null;
  return dumpMajor >= serverMajor;
}

let cachedPgDumpVersion: string | null | undefined;

/** Resolve local `pg_dump` version (worker process). Cached after first success/failure. */
export async function detectLocalPgDumpVersion(): Promise<string | null> {
  if (cachedPgDumpVersion !== undefined) return cachedPgDumpVersion;
  const bin = process.env.PG_DUMP_BIN?.trim() || 'pg_dump';
  try {
    const { stdout } = await execFileAsync(bin, ['--version'], {
      timeout: 5_000,
      maxBuffer: 64 * 1024,
      env: process.env,
    });
    cachedPgDumpVersion = parsePgDumpVersionOutput(stdout);
  } catch {
    cachedPgDumpVersion = null;
  }
  return cachedPgDumpVersion;
}

/** Test helper: clear cached detection result. */
export function resetLocalPgDumpVersionCacheForTests(): void {
  cachedPgDumpVersion = undefined;
}
