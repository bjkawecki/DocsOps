import { describe, expect, it } from 'vitest';
import { formatBackupErrorMessage } from './backupErrorMessage';

const t = (key: string, options?: Record<string, unknown>) => {
  if (options && Object.keys(options).length > 0) {
    return `i18n:${key}:${JSON.stringify(options)}`;
  }
  return `i18n:${key}`;
};

describe('formatBackupErrorMessage', () => {
  it('maps known codes (short)', () => {
    expect(formatBackupErrorMessage('BACKUP_PG_DUMP_VERSION_MISMATCH', t)).toBe(
      'i18n:backup.errors.BACKUP_PG_DUMP_VERSION_MISMATCH'
    );
  });

  it('maps legacy version-mismatch stderr snippets (short)', () => {
    expect(
      formatBackupErrorMessage('pg_dump: error: aborting because of server version mismatch', t)
    ).toBe('i18n:backup.errors.BACKUP_PG_DUMP_VERSION_MISMATCH');
  });

  it('detailed mismatch includes version pair when stored', () => {
    const stored = 'BACKUP_PG_DUMP_VERSION_MISMATCH\nserver version: 18.4; pg_dump version: 15.19';
    expect(formatBackupErrorMessage(stored, t, { detailed: true })).toBe(
      'i18n:backup.errors.BACKUP_PG_DUMP_VERSION_MISMATCH\n\ni18n:backup.errors.BACKUP_PG_DUMP_VERSION_MISMATCH_DETAIL:{"serverVersion":"18.4","pgDumpVersion":"15.19"}'
    );
  });

  it('detailed mismatch without versions uses hint', () => {
    expect(formatBackupErrorMessage('BACKUP_PG_DUMP_VERSION_MISMATCH', t, { detailed: true })).toBe(
      'i18n:backup.errors.BACKUP_PG_DUMP_VERSION_MISMATCH\n\ni18n:backup.errors.BACKUP_PG_DUMP_VERSION_MISMATCH_HINT'
    );
  });

  it('falls back to raw message for unknown errors', () => {
    expect(formatBackupErrorMessage('something else', t)).toBe('something else');
  });
});
