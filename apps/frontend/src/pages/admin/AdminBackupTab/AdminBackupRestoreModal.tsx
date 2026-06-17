import { Button, Group, Modal, Stack, Text } from '@mantine/core';

type Props = {
  opened: boolean;
  onClose: () => void;
  loading: boolean;
  sourceLabel: string;
  onConfirm: () => void;
};

export function AdminBackupRestoreModal({
  opened,
  onClose,
  loading,
  sourceLabel,
  onConfirm,
}: Props) {
  return (
    <Modal opened={opened} onClose={onClose} title="Restore from backup?" centered>
      <Stack gap="md">
        <Text size="sm">
          This will replace the <strong>entire database</strong> and MinIO objects with the contents
          of <strong>{sourceLabel}</strong>. Existing data will be overwritten.
        </Text>
        <Text size="sm" c="dimmed">
          Secrets from <code>.env</code> (session secret, encryption keys) are not in the archive —
          configure them separately. All users will need to sign in again after restore.
        </Text>
        <Text size="sm" c="dimmed">
          Write operations are blocked while restore runs (maintenance mode).
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button color="red" loading={loading} onClick={onConfirm}>
            Start restore
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
