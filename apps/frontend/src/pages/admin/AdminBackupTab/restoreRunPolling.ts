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

export const RESTORE_SUPERSEDED_ERROR = 'Run was superseded by disaster recovery restore';

export function isSupersededMaintenanceFailure(run: {
  status: string;
  errorMessage?: string | null;
}): boolean {
  return (
    run.status === 'failed' &&
    (run.errorMessage?.includes('superseded by disaster recovery restore') ?? false)
  );
}

export function isSupersededRestoreFailure(run: RestoreRun): boolean {
  return isSupersededMaintenanceFailure(run);
}
