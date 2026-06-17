import { describe, expect, it } from 'vitest';
import type { BackupRun } from './adminBackupTypes';
import { listRestorableBackups } from './backupRestoreHelpers';

describe('listRestorableBackups', () => {
  const runs: BackupRun[] = [
    {
      id: '1',
      status: 'succeeded',
      triggerSource: 'manual',
      localObjectKey: 'backups/a.tar.zst',
      remotePath: null,
      sizeBytes: 1000,
      createdAt: '2026-01-01T00:00:00Z',
      finishedAt: '2026-01-01T00:01:00Z',
      errorMessage: null,
      destination: null,
    },
    {
      id: '2',
      status: 'succeeded',
      triggerSource: 'manual',
      localObjectKey: null,
      remotePath: 'offsite/a.tar.zst',
      sizeBytes: 1000,
      createdAt: '2026-01-02T00:00:00Z',
      finishedAt: '2026-01-02T00:01:00Z',
      errorMessage: null,
      destination: null,
    },
    {
      id: '3',
      status: 'failed',
      triggerSource: 'manual',
      localObjectKey: null,
      remotePath: null,
      sizeBytes: null,
      createdAt: '2026-01-03T00:00:00Z',
      finishedAt: '2026-01-03T00:01:00Z',
      errorMessage: 'boom',
      destination: null,
    },
  ];

  it('returns only succeeded backups with a local copy', () => {
    expect(listRestorableBackups(runs).map((r) => r.id)).toEqual(['1']);
  });
});
