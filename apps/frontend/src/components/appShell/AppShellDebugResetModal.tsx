import { Button, Group, Modal, Stack, Text } from '@mantine/core';

type Props = {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
};

export function AppShellDebugResetModal({ opened, onClose, onConfirm, loading }: Props) {
  return (
    <Modal opened={opened} onClose={onClose} title="Reset platform data?" size="sm">
      <Stack gap="md">
        <Text size="sm">
          Delete all companies, documents, contexts, and non-admin users from this instance. Admin
          accounts stay. Operational backup settings and migration run history are kept.
        </Text>
        <Text size="sm" c="dimmed">
          Only allowed when DATABASE_URL points to a database name listed in
          DEV_DESTRUCTIVE_DB_NAMES (default: docsops).
        </Text>
        <Text size="sm" fw={600}>
          This cannot be undone.
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button color="red" loading={loading} onClick={onConfirm}>
            Reset platform data
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
