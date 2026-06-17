import type { BackupRun } from './adminBackupTypes';

export function listRestorableBackups(runs: BackupRun[] | undefined): BackupRun[] {
  return (runs ?? []).filter((run) => run.status === 'succeeded' && run.localObjectKey != null);
}

export function formatBackupRunLabel(run: BackupRun): string {
  const when = new Date(run.createdAt).toLocaleString();
  const size = run.sizeBytes != null ? ` · ${Math.round(run.sizeBytes / 1024)} KB` : '';
  return `${when}${size}`;
}

export function formatActiveJobStatus(args: {
  maintenanceActive: boolean;
  maintenanceReason?: string | null;
  backupRuns?: BackupRun[];
  restoreStatus?: string | null;
}): string | null {
  if (args.maintenanceActive) {
    if (args.maintenanceReason === 'restore') {
      return args.restoreStatus
        ? `Disaster recovery restore in progress (${args.restoreStatus.replace(/_/g, ' ')})`
        : 'Disaster recovery restore in progress';
    }
    const inProgressBackup = args.backupRuns?.find((r) =>
      ['queued', 'running', 'uploading'].includes(r.status)
    );
    if (inProgressBackup) {
      return `Backup in progress (${inProgressBackup.status})`;
    }
    return 'Maintenance in progress';
  }
  return null;
}
