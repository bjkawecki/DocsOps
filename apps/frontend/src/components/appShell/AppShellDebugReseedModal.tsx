import { Button, Group, Modal, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';

type Props = {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
};

export function AppShellDebugReseedModal({ opened, onClose, onConfirm, loading }: Props) {
  const { t } = useTranslation(['shell', 'common']);

  return (
    <Modal opened={opened} onClose={onClose} title={t('shell:debug.reseedTitle')} size="sm">
      <Stack gap="md">
        <Text size="sm">{t('shell:debug.reseedBody')}</Text>
        <Text size="sm" c="dimmed">
          {t('shell:debug.resetDbGuard')}
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose} disabled={loading}>
            {t('common:actions.cancel')}
          </Button>
          <Button loading={loading} onClick={onConfirm}>
            {t('shell:debug.reseedConfirm')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
