import { Button, Group, Modal, Stack, Text } from '@mantine/core';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

type Props = {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
};

export function AdminBackupEnableAutoModal({ opened, onClose, onConfirm, loading }: Props) {
  const { t } = useTranslation(['admin', 'common']);
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t('backup.autoBackup.enableModal.title')}
      size="sm"
    >
      <Stack gap="md">
        <Text size="sm">
          <Trans
            t={t}
            i18nKey="backup.autoBackup.enableModal.body"
            components={{
              strong: <strong />,
              schedulerLink: <Link to="/admin/operations/scheduler" />,
              code: <code />,
            }}
          />
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            {t('common:actions.cancel')}
          </Button>
          <Button loading={loading} onClick={onConfirm}>
            {t('backup.autoBackup.enableModal.confirm')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
