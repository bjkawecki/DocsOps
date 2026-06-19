import { spawnSync } from 'node:child_process';
import { readRootPackageVersion } from './read-root-package-version.js';

const sepIndex = process.argv.indexOf('--');
if (sepIndex < 0 || sepIndex === process.argv.length - 1) {
  console.error('Usage: tsx scripts/run-with-app-version.ts -- <command> [args...]');
  process.exit(1);
}

process.env.APP_VERSION = readRootPackageVersion();
const command = process.argv.slice(sepIndex + 1);
const result = spawnSync(command[0], command.slice(1), {
  stdio: 'inherit',
  env: process.env,
});

process.exit(result.status ?? 1);
