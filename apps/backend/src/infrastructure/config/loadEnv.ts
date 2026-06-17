import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Repo root: apps/backend/src/infrastructure/config → five levels up. */
const REPO_ROOT_ENV = resolve(__dirname, '../../../../../.env');

function envCandidates(): string[] {
  const cwd = process.cwd();
  return [resolve(cwd, '.env'), resolve(cwd, '../../.env'), REPO_ROOT_ENV];
}

let loaded = false;

/**
 * Loads the first existing `.env` from repo root or cwd. Does not override variables
 * already set in the environment (e.g. Docker Compose). Safe to import multiple times.
 */
export function loadEnvFromFilesystem(): void {
  if (loaded) return;
  loaded = true;
  for (const path of envCandidates()) {
    if (!existsSync(path)) continue;
    config({ path, override: false });
    return;
  }
}

loadEnvFromFilesystem();
