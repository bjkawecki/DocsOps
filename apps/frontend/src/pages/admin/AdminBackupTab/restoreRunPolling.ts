import type { RestoreRun } from './adminBackupTypes';

const IN_PROGRESS_RESTORE_STATUSES = new Set([
  'queued',
  'running',
  'validating',
  'restoring_db',
  'restoring_minio',
]);

export function hasInProgressRestoreRun(runs: RestoreRun[] | undefined): boolean {
  return runs?.some((r) => IN_PROGRESS_RESTORE_STATUSES.has(r.status)) ?? false;
}

export function isInProgressRestoreStatus(status: string): boolean {
  return IN_PROGRESS_RESTORE_STATUSES.has(status);
}

export function formatRestoreSource(run: RestoreRun): string {
  if (run.source === 'history' && run.backupRun) {
    return `Backup ${new Date(run.backupRun.createdAt).toLocaleString()}`;
  }
  if (run.source === 'upload') return 'Uploaded archive';
  return run.source;
}
