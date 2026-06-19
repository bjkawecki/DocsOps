import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');
const rootPackage = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8')) as {
  version?: string;
};
const appVersion = rootPackage.version ?? '';
if (!/^\d+\.\d+\.\d+$/.test(appVersion)) {
  throw new Error(`Invalid or missing version in root package.json (${repoRoot})`);
}

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    env: {
      APP_VERSION: appVersion,
    },
    include: ['src/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    globalSetup: ['src/testing/globalSetup.ts'],
    /** Eine gemeinsame Test-DB: keine parallelen Testdateien, damit z. B. Admin-Setup andere Suites nicht stört. */
    fileParallelism: false,
  },
});
