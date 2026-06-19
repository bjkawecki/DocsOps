import { Button, Group, Modal, Stack, Text } from '@mantine/core';
import type { BackupRun } from './adminBackupTypes';

type Props = {
  run: BackupRun | null;
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
};

function deleteConfirmMessage(run: BackupRun): string {
  const hasExternal = Boolean(run.remotePath);
  const hasLocal = Boolean(run.localObjectKey);

  if (hasLocal && hasExternal) {
    return 'Remove the local copy from DocsOps and delete this entry from backup history. The archive on the external destination is kept.';
  }
  if (hasLocal && !hasExternal) {
    return 'Remove the local copy and delete this entry from backup history. There is no external copy – this backup will no longer be available in DocsOps.';
  }
  if (!hasLocal && hasExternal) {
    return 'Delete this entry from backup history in DocsOps. The archive on the external destination is kept.';
  }
  return 'Delete this entry from backup history in DocsOps. No local or external copy exists.';
}

export function AdminBackupDeleteModal({ run, opened, onClose, onConfirm, loading }: Props) {
  return (
    <Modal opened={opened} onClose={onClose} title="Delete backup?" size="sm">
      <Stack gap="md">
        <Text size="sm">{run ? deleteConfirmMessage(run) : ''}</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button color="red" loading={loading} onClick={onConfirm}>
            Delete
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
