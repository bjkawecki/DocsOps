import { Button, Group, Modal, Stack, Text } from '@mantine/core';

type Props = {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
};

export function AppShellDebugReseedModal({ opened, onClose, onConfirm, loading }: Props) {
  return (
    <Modal opened={opened} onClose={onClose} title="Re-seed from CSV?" size="sm">
      <Stack gap="md">
        <Text size="sm">
          Load demo data from <code>prisma/seed-data</code> CSV files into an empty database. Run
          reset first if companies or documents still exist.
        </Text>
        <Text size="sm" c="dimmed">
          Only allowed when DATABASE_URL points to a database name listed in
          DEV_DESTRUCTIVE_DB_NAMES (default: docsops).
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button loading={loading} onClick={onConfirm}>
            Re-seed
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
