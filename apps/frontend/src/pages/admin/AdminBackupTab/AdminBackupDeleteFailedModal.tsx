import { Button, Group, Modal, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { BackupRun, TranslateFn } from './adminBackupTypes';

type Props = {
  opened: boolean;
  runStatus?: BackupRun['status'];
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
};

function modalCopy(
  status: BackupRun['status'] | undefined,
  t: TranslateFn
): { title: string; body: string } {
  if (status === 'queued' || status === 'running' || status === 'uploading') {
    return {
      title: t('backup.deleteFailedModal.stuckTitle'),
      body: t('backup.deleteFailedModal.stuckBody'),
    };
  }
  return {
    title: t('backup.deleteFailedModal.failedTitle'),
    body: t('backup.deleteFailedModal.failedBody'),
  };
}

export function AdminBackupDeleteFailedModal({
  opened,
  runStatus,
  onClose,
  onConfirm,
  loading,
}: Props) {
  const { t } = useTranslation(['admin', 'common']);
  const copy = modalCopy(runStatus, t);

  return (
    <Modal opened={opened} onClose={onClose} title={copy.title} size="sm">
      <Stack gap="md">
        <Text size="sm">{copy.body}</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose} disabled={loading}>
            {t('common:actions.cancel')}
          </Button>
          <Button color="red" loading={loading} onClick={onConfirm}>
            {t('backup.deleteFailedModal.confirm')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
