import { describe, it, expect } from 'vitest';
import { buildPgDumpArgs, buildPgRestoreArgs } from './postgresBackupTargets.js';

describe('postgresBackupTargets', () => {
  it('buildPgDumpArgs excludes pgboss and maintenance lock data', () => {
    expect(buildPgDumpArgs('/tmp/dump.custom', 'postgresql://app:app@db/docsops')).toEqual([
      '-Fc',
      '-f',
      '/tmp/dump.custom',
      '--dbname',
      'postgresql://app:app@db/docsops',
      '-N',
      'pgboss',
      '--exclude-table-data',
      'public."SystemMaintenanceLock"',
    ]);
  });

  it('buildPgRestoreArgs excludes pgboss and fails fast on errors', () => {
    expect(buildPgRestoreArgs('/tmp/dump.custom', 'postgresql://app:app@db/docsops')).toEqual([
      '--clean',
      '--if-exists',
      '--exit-on-error',
      '--no-owner',
      '--no-acl',
      '--dbname',
      'postgresql://app:app@db/docsops',
      '-N',
      'pgboss',
      '/tmp/dump.custom',
    ]);
  });
});
