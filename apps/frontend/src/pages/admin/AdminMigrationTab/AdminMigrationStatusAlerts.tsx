import { Alert } from '@mantine/core';
import {
  type PlatformMigrationStatus,
  formatPlatformImportStatus,
  formatPlatformRunStatus,
  isFailedPlatformImportStatus,
} from './adminMigrationTypes';

type Props = {
  status: PlatformMigrationStatus;
};

export function AdminMigrationStatusAlerts({ status }: Props) {
  const { activeExportRun, activeImportRun, lastExportRun, lastImportRun } = status;

  const lastExportFailed = lastExportRun?.status === 'failed' && !activeExportRun;
  const lastImportFailed =
    lastImportRun != null && isFailedPlatformImportStatus(lastImportRun.status) && !activeImportRun;

  return (
    <>
      {!status.minioAvailable ? (
        <Alert color="red" variant="filled" title="Object storage unavailable">
          MinIO is not configured or unreachable. Platform export and import require object storage.
        </Alert>
      ) : null}
      {!status.workerConnected ? (
        <Alert color="red" variant="filled" title="Job worker disconnected">
          Background export and import jobs need a connected worker. Check Admin → Jobs.
        </Alert>
      ) : null}
      {status.maintenanceActive && status.maintenanceReason !== 'platform-import' ? (
        <Alert color="red" variant="filled" title="Maintenance mode active">
          Migration actions may be blocked while maintenance is active (
          {status.maintenanceReason ?? 'unknown'}).
        </Alert>
      ) : null}
      {lastExportFailed && lastExportRun ? (
        <Alert color="red" variant="filled" title="Export failed">
          <span>
            {new Date(lastExportRun.createdAt).toLocaleString()} —{' '}
            {formatPlatformRunStatus(lastExportRun.status, 'export')}
          </span>
          {lastExportRun.errorMessage ? (
            <span style={{ display: 'block', marginTop: 4 }}>{lastExportRun.errorMessage}</span>
          ) : null}
        </Alert>
      ) : null}
      {lastImportFailed && lastImportRun ? (
        <Alert color="red" variant="filled" title="Import failed">
          <span>
            {new Date(lastImportRun.createdAt).toLocaleString()} —{' '}
            {formatPlatformRunStatus(lastImportRun.status, 'import')}
          </span>
          {lastImportRun.errorMessage ? (
            <span style={{ display: 'block', marginTop: 4 }}>{lastImportRun.errorMessage}</span>
          ) : null}
          <span style={{ display: 'block', marginTop: 4 }}>
            Domain data should have been rolled back on this instance. Platform import is only
            supported on a freshly installed empty instance.
          </span>
        </Alert>
      ) : null}
      {activeExportRun ? (
        <Alert color="blue" variant="filled" title="Export in progress">
          {formatPlatformRunStatus(activeExportRun.status, 'export')}…
        </Alert>
      ) : null}
      {activeImportRun ? (
        <Alert color="blue" variant="filled" title="Import in progress">
          {formatPlatformImportStatus(activeImportRun.status)}…
        </Alert>
      ) : null}
    </>
  );
}
