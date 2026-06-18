import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);

function resolveBackendPackageJson(): string {
  let dir = dirname(fileURLToPath(import.meta.url));
  for (;;) {
    const candidate = join(dir, 'package.json');
    try {
      const raw = readFileSync(candidate, 'utf8');
      const parsed = JSON.parse(raw) as { name?: string };
      if (parsed.name === 'backend') {
        return candidate;
      }
    } catch {
      // try parent directory
    }
    const parent = dirname(dir);
    if (parent === dir) {
      throw new Error('backend package.json not found');
    }
    dir = parent;
  }
}

const pkg = require(resolveBackendPackageJson()) as { name: string; version: string };

export const backendPackageName = pkg.name;
export const backendPackageVersion = pkg.version;
