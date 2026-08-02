import { Button, Group, Modal, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { BackupRun, TranslateFn } from './adminBackupTypes';

type Props = {
  run: BackupRun | null;
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
};

function deleteConfirmMessage(run: BackupRun, t: TranslateFn): string {
  const hasExternal = Boolean(run.remotePath);
  const hasLocal = Boolean(run.localObjectKey);

  if (hasLocal && hasExternal) return t('backup.deleteModal.bothCopies');
  if (hasLocal && !hasExternal) return t('backup.deleteModal.localOnly');
  if (!hasLocal && hasExternal) return t('backup.deleteModal.externalOnly');
  return t('backup.deleteModal.neither');
}

export function AdminBackupDeleteModal({ run, opened, onClose, onConfirm, loading }: Props) {
  const { t } = useTranslation(['admin', 'common']);
  return (
    <Modal opened={opened} onClose={onClose} title={t('backup.deleteModal.title')} size="sm">
      <Stack gap="md">
        <Text size="sm">{run ? deleteConfirmMessage(run, t) : ''}</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose} disabled={loading}>
            {t('common:actions.cancel')}
          </Button>
          <Button color="red" loading={loading} onClick={onConfirm}>
            {t('common:actions.delete')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
