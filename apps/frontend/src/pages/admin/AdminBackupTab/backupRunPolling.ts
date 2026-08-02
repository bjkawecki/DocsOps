import type { BackupRun, TranslateFn } from './adminBackupTypes';

const IN_PROGRESS_BACKUP_STATUSES = new Set(['queued', 'running', 'uploading']);

export const BACKUP_RUN_POLL_INTERVAL_MS = 3000;

/** Poll backup history while the tab is open even when no run is in progress. */
export const BACKUP_RUN_IDLE_POLL_INTERVAL_MS = 15_000;

/** Keep polling briefly after "Backup now" until the new run appears in the list. */
export const BACKUP_POLL_BOOST_MS = 90_000;

export function hasInProgressBackupRun(runs: BackupRun[] | undefined): boolean {
  return runs?.some((r) => IN_PROGRESS_BACKUP_STATUSES.has(r.status)) ?? false;
}

export function shouldPollBackupRuns(
  runs: BackupRun[] | undefined,
  pollBoostUntilMs: number
): boolean {
  if (Date.now() < pollBoostUntilMs) return true;
  return hasInProgressBackupRun(runs);
}

export function getBackupRunsRefetchIntervalMs(args: {
  runs: BackupRun[] | undefined;
  pollBoostUntilMs: number;
  maintenanceActive?: boolean;
  isTabVisible: boolean;
}): number | false {
  const { runs, pollBoostUntilMs, maintenanceActive, isTabVisible } = args;
  if (shouldPollBackupRuns(runs, pollBoostUntilMs) || maintenanceActive) {
    return BACKUP_RUN_POLL_INTERVAL_MS;
  }
  if (!isTabVisible) return false;
  return BACKUP_RUN_IDLE_POLL_INTERVAL_MS;
}

export function isInProgressBackupStatus(status: string): boolean {
  return IN_PROGRESS_BACKUP_STATUSES.has(status);
}

export function formatDestinationTypeShort(type: 'S3_COMPATIBLE' | 'SSH' | 'WEBDAV'): string {
  if (type === 'S3_COMPATIBLE') return 'S3';
  if (type === 'SSH') return 'SSH';
  return 'WebDAV';
}

export function formatExternalDestinationLabel(run: BackupRun, t: TranslateFn): string {
  if (run.destination?.name) {
    return `${run.destination.name} (${formatDestinationTypeShort(run.destination.type)})`;
  }
  if (run.status === 'succeeded') return t('backup.history.localOnly');
  return '–';
}

export function formatBackupRunStatusLabel(status: string, t: TranslateFn): string {
  switch (status) {
    case 'queued':
      return t('backup.runStatus.queued');
    case 'running':
      return t('backup.runStatus.running');
    case 'uploading':
      return t('backup.runStatus.uploading');
    case 'succeeded':
      return t('backup.runStatus.succeeded');
    case 'failed':
      return t('backup.runStatus.failed');
    default:
      return status;
  }
}

export function formatTriggerSourceLabel(source: string, t: TranslateFn): string {
  switch (source) {
    case 'manual':
      return t('backup.triggerSource.manual');
    case 'schedule':
      return t('backup.triggerSource.schedule');
    case 'pre_update':
      return t('backup.triggerSource.preUpdate');
    default:
      return source;
  }
}
