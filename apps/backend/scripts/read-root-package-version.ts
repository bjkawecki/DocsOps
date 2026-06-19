import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Reads SemVer from root package.json (SSoT). For dev/test/build tooling only —
 * runtime code must use process.env.APP_VERSION via resolveAppVersion().
 */
export function readRootPackageVersion(): string {
  const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
  const raw = readFileSync(join(repoRoot, 'package.json'), 'utf8');
  const parsed = JSON.parse(raw) as { version?: string };
  const version = parsed.version?.trim();
  if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
    throw new Error(`Invalid or missing version in root package.json (${repoRoot})`);
  }
  return version;
}
