/** PostgreSQL objects excluded from operational backup/restore (see runbook). */
export const BACKUP_EXCLUDED_SCHEMAS = ['pgboss'] as const;

/** Volatile singleton row – must not be restored from archive snapshots. */
export const BACKUP_EXCLUDED_TABLE_DATA = ['public."SystemMaintenanceLock"'] as const;

export function buildPgDumpArgs(outputPath: string, databaseUrl: string): string[] {
  const args = ['-Fc', '-f', outputPath, '--dbname', databaseUrl];
  for (const schema of BACKUP_EXCLUDED_SCHEMAS) {
    args.push('-N', schema);
  }
  for (const table of BACKUP_EXCLUDED_TABLE_DATA) {
    args.push('--exclude-table-data', table);
  }
  return args;
}

export function buildPgRestoreArgs(dumpPath: string, databaseUrl: string): string[] {
  const args = [
    '--clean',
    '--if-exists',
    '--exit-on-error',
    '--no-owner',
    '--no-acl',
    '--dbname',
    databaseUrl,
  ];
  for (const schema of BACKUP_EXCLUDED_SCHEMAS) {
    args.push('-N', schema);
  }
  return args.concat(dumpPath);
}
