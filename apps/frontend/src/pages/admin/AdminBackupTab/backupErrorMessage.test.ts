import { describe, expect, it } from 'vitest';
import { formatBackupErrorMessage } from './backupErrorMessage';

const t = (key: string) => `i18n:${key}`;

describe('formatBackupErrorMessage', () => {
  it('maps known codes', () => {
    expect(formatBackupErrorMessage('BACKUP_PG_DUMP_VERSION_MISMATCH', t)).toBe(
      'i18n:backup.errors.BACKUP_PG_DUMP_VERSION_MISMATCH'
    );
  });

  it('maps legacy version-mismatch stderr snippets', () => {
    expect(
      formatBackupErrorMessage('pg_dump: error: aborting because of server version mismatch', t)
    ).toBe('i18n:backup.errors.BACKUP_PG_DUMP_VERSION_MISMATCH');
  });

  it('falls back to raw message for unknown errors', () => {
    expect(formatBackupErrorMessage('something else', t)).toBe('something else');
  });
});
