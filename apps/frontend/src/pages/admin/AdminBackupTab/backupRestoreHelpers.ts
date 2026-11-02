import type { BackupRun, TranslateFn } from './adminBackupTypes';
import { formatBackupRunStatusLabel } from './backupRunPolling';
import { formatRestoreStatusLabel } from './restoreRunPolling';

export function listRestorableBackups(runs: BackupRun[] | undefined): BackupRun[] {
  return (runs ?? []).filter((run) => run.status === 'succeeded' && run.localObjectKey != null);
}

export function formatBackupRunLabel(run: BackupRun): string {
  const when = new Date(run.createdAt).toLocaleString();
  const size = run.sizeBytes != null ? ` · ${Math.round(run.sizeBytes / 1024)} KB` : '';
  return `${when}${size}`;
}

export function formatActiveJobStatus(
  args: {
    maintenanceActive: boolean;
    maintenanceReason?: string | null;
    backupRuns?: BackupRun[];
    restoreStatus?: string | null;
  },
  t: TranslateFn
): string | null {
  if (args.maintenanceActive) {
    if (args.maintenanceReason === 'restore') {
      return args.restoreStatus
        ? t('backup.activeJob.restoreInProgressWithStatus', {
            status: formatRestoreStatusLabel(args.restoreStatus, t),
          })
        : t('backup.activeJob.restoreInProgress');
    }
    const inProgressBackup = args.backupRuns?.find((r) =>
      ['queued', 'running', 'uploading'].includes(r.status)
    );
    if (inProgressBackup) {
      return t('backup.activeJob.backupInProgress', {
        status: formatBackupRunStatusLabel(inProgressBackup.status, t),
      });
    }
    return t('backup.activeJob.maintenanceInProgress');
  }
  return null;
}
