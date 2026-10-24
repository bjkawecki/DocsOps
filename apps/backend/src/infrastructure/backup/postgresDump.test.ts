import { describe, expect, it } from 'vitest';
import {
  BACKUP_PG_DUMP_FAILED,
  BACKUP_PG_DUMP_NOT_FOUND,
  BACKUP_PG_DUMP_VERSION_MISMATCH,
  wrapPgDumpError,
} from './postgresDump.js';

describe('wrapPgDumpError', () => {
  it('maps ENOENT to not-found code', () => {
    const err = Object.assign(new Error('spawn pg_dump ENOENT'), { code: 'ENOENT' });
    expect(wrapPgDumpError(err).message).toBe(BACKUP_PG_DUMP_NOT_FOUND);
  });

  it('maps version mismatch without leaking command argv', () => {
    const err = Object.assign(
      new Error('Command failed: pg_dump --dbname postgresql://app:secret@postgres:5432/docsops'),
      {
        stderr:
          'pg_dump: error: aborting because of server version mismatch\npg_dump: detail: server version: 18.4; pg_dump version: 15.19',
      }
    );
    const wrapped = wrapPgDumpError(err);
    expect(wrapped.message).toBe(BACKUP_PG_DUMP_VERSION_MISMATCH);
    expect(wrapped.message).not.toMatch(/secret|postgresql:\/\//);
  });

  it('maps other failures to generic code', () => {
    const err = Object.assign(new Error('Command failed: pg_dump'), {
      stderr: 'pg_dump: error: connection refused',
    });
    expect(wrapPgDumpError(err).message).toBe(BACKUP_PG_DUMP_FAILED);
  });
});
