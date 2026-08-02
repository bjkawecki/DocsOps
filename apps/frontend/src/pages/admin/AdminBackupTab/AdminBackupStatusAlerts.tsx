import { Alert } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { BackupStatus } from './adminBackupTypes';

type Props = {
  status: BackupStatus;
};

export function AdminBackupStatusAlerts({ status }: Props) {
  const { t } = useTranslation('admin');
  return (
    <>
      {!status.minioAvailable && (
        <Alert color="red" title={t('backup.statusAlerts.objectStorageUnavailableTitle')}>
          {t('backup.statusAlerts.objectStorageUnavailableBody')}
        </Alert>
      )}
      {!status.encryptionConfigured && (
        <Alert
          color="red"
          variant="filled"
          title={t('backup.statusAlerts.encryptionNotConfiguredTitle')}
        >
          {t('backup.statusAlerts.encryptionNotConfiguredBody')}
        </Alert>
      )}
    </>
  );
}
