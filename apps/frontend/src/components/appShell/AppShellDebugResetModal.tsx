import { Button, Group, Modal, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';

type Props = {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
};

export function AppShellDebugResetModal({ opened, onClose, onConfirm, loading }: Props) {
  const { t } = useTranslation(['shell', 'common']);

  return (
    <Modal opened={opened} onClose={onClose} title={t('shell:debug.resetTitle')} size="sm">
      <Stack gap="md">
        <Text size="sm">{t('shell:debug.resetBody')}</Text>
        <Text size="sm" c="dimmed">
          {t('shell:debug.resetDbGuard')}
        </Text>
        <Text size="sm" fw={600}>
          {t('shell:debug.resetIrreversible')}
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose} disabled={loading}>
            {t('common:actions.cancel')}
          </Button>
          <Button color="red" loading={loading} onClick={onConfirm}>
            {t('shell:debug.resetPlatform')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
