import { Alert } from '@mantine/core';
import type { BackupStatus } from './adminBackupTypes';

type Props = {
  status: BackupStatus;
};

export function AdminBackupStatusAlerts({ status }: Props) {
  const isRestoreMaintenance = status.maintenanceReason === 'restore';

  return (
    <>
      {!status.minioAvailable && (
        <Alert color="red" title="Object storage unavailable">
          MinIO is not configured or unreachable. Backups require object storage for file export.
        </Alert>
      )}
      {!status.encryptionConfigured && (
        <Alert color="red" variant="filled" title="Encryption not configured">
          Set BACKUP_ENCRYPTION_KEY on the server before storing external backup targets. See README
          for how to generate a key.
        </Alert>
      )}
      {status.maintenanceActive && isRestoreMaintenance && (
        <Alert color="orange" variant="filled" title="Restore in progress">
          A disaster-recovery restore is running. Write operations are temporarily blocked. Users
          may need to sign in again after restore completes.
        </Alert>
      )}
      {status.maintenanceActive && !isRestoreMaintenance && (
        <Alert color="blue" variant="filled" title="Maintenance mode">
          A backup is in progress. Write operations are temporarily blocked.
        </Alert>
      )}
    </>
  );
}
