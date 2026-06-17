import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  BACKUP_POLL_BOOST_MS,
  formatExternalDestinationLabel,
  hasInProgressBackupRun,
  shouldPollBackupRuns,
} from './backupRunPolling';
import type { BackupRun } from './adminBackupTypes';

const baseRun: BackupRun = {
  id: '1',
  status: 'queued',
  triggerSource: 'manual',
  sizeBytes: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  finishedAt: null,
  errorMessage: null,
  destination: null,
  localObjectKey: null,
  remotePath: null,
};

describe('backupRunPolling', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('treats queued as in progress', () => {
    expect(hasInProgressBackupRun([{ ...baseRun, status: 'queued' }])).toBe(true);
  });

  it('does not poll when all runs are terminal', () => {
    expect(
      hasInProgressBackupRun([
        { ...baseRun, status: 'succeeded' },
        { ...baseRun, status: 'failed' },
      ])
    ).toBe(false);
  });

  it('polls during boost window even without in-progress runs', () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000);
    const boostUntil = 1_000 + BACKUP_POLL_BOOST_MS;
    expect(shouldPollBackupRuns([{ ...baseRun, status: 'succeeded' }], boostUntil)).toBe(true);
    vi.setSystemTime(boostUntil);
    expect(shouldPollBackupRuns([{ ...baseRun, status: 'succeeded' }], boostUntil)).toBe(false);
  });

  it('formats external destination with type', () => {
    expect(
      formatExternalDestinationLabel({
        ...baseRun,
        destination: { id: 'd1', name: 'AWS prod', type: 'S3_COMPATIBLE' },
      })
    ).toBe('AWS prod (S3)');
    expect(
      formatExternalDestinationLabel({
        ...baseRun,
        destination: { id: 'd2', name: 'Borg host', type: 'SSH' },
      })
    ).toBe('Borg host (SSH)');
  });
});
