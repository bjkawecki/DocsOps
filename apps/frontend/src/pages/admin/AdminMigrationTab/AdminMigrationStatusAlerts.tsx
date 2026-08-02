import { Alert } from '@mantine/core';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('admin');
  const { activeExportRun, activeImportRun, lastExportRun, lastImportRun } = status;

  const lastExportFailed = lastExportRun?.status === 'failed' && !activeExportRun;
  const lastImportFailed =
    lastImportRun != null && isFailedPlatformImportStatus(lastImportRun.status) && !activeImportRun;

  return (
    <>
      {!status.minioAvailable ? (
        <Alert
          color="red"
          variant="filled"
          title={t('migration.statusAlerts.storageUnavailableTitle')}
        >
          {t('migration.statusAlerts.storageUnavailableMessage')}
        </Alert>
      ) : null}
      {!status.workerConnected ? (
        <Alert
          color="red"
          variant="filled"
          title={t('migration.statusAlerts.workerDisconnectedTitle')}
        >
          {t('migration.statusAlerts.workerDisconnectedMessage')}
        </Alert>
      ) : null}
      {status.maintenanceActive && status.maintenanceReason !== 'platform-import' ? (
        <Alert
          color="red"
          variant="filled"
          title={t('migration.statusAlerts.maintenanceActiveTitle')}
        >
          {t('migration.statusAlerts.maintenanceActiveMessage', {
            reason:
              status.maintenanceReason ?? t('migration.statusAlerts.maintenanceReasonUnknown'),
          })}
        </Alert>
      ) : null}
      {lastExportFailed && lastExportRun ? (
        <Alert color="red" variant="filled" title={t('migration.statusAlerts.exportFailedTitle')}>
          <span>
            {new Date(lastExportRun.createdAt).toLocaleString()} –{' '}
            {formatPlatformRunStatus(lastExportRun.status, 'export', t)}
          </span>
          {lastExportRun.errorMessage ? (
            <span style={{ display: 'block', marginTop: 4 }}>{lastExportRun.errorMessage}</span>
          ) : null}
        </Alert>
      ) : null}
      {lastImportFailed && lastImportRun ? (
        <Alert color="red" variant="filled" title={t('migration.statusAlerts.importFailedTitle')}>
          <span>
            {new Date(lastImportRun.createdAt).toLocaleString()} –{' '}
            {formatPlatformRunStatus(lastImportRun.status, 'import', t)}
          </span>
          {lastImportRun.errorMessage ? (
            <span style={{ display: 'block', marginTop: 4 }}>{lastImportRun.errorMessage}</span>
          ) : null}
          <span style={{ display: 'block', marginTop: 4 }}>
            {t('migration.statusAlerts.importFailedRollbackHint')}
          </span>
        </Alert>
      ) : null}
      {activeExportRun ? (
        <Alert
          color="blue"
          variant="filled"
          title={t('migration.statusAlerts.exportInProgressTitle')}
        >
          {formatPlatformRunStatus(activeExportRun.status, 'export', t)}…
        </Alert>
      ) : null}
      {activeImportRun ? (
        <Alert
          color="blue"
          variant="filled"
          title={t('migration.statusAlerts.importInProgressTitle')}
        >
          {formatPlatformImportStatus(activeImportRun.status, t)}…
        </Alert>
      ) : null}
    </>
  );
}
