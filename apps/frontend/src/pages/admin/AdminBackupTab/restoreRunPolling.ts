import type { RestoreRun, TranslateFn } from './adminBackupTypes';

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

export function formatRestoreSource(run: RestoreRun, t: TranslateFn): string {
  if (run.source === 'history' && run.backupRun) {
    return t('backup.restoreSource.fromBackup', {
      date: new Date(run.backupRun.createdAt).toLocaleString(),
    });
  }
  if (run.source === 'upload') return t('backup.restoreSource.uploadedArchive');
  return run.source;
}

export function formatRestoreStatusLabel(status: string, t: TranslateFn): string {
  switch (status) {
    case 'queued':
      return t('backup.restoreStatus.queued');
    case 'running':
      return t('backup.restoreStatus.running');
    case 'validating':
      return t('backup.restoreStatus.validating');
    case 'restoring_db':
      return t('backup.restoreStatus.restoringDb');
    case 'restoring_minio':
      return t('backup.restoreStatus.restoringMinio');
    default:
      return status;
  }
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
