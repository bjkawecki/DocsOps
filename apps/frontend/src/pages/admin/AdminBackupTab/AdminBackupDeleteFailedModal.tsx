import { Button, Group, Modal, Stack, Text } from '@mantine/core';
import type { BackupRun } from './adminBackupTypes';

type Props = {
  opened: boolean;
  runStatus?: BackupRun['status'];
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
};

function modalCopy(status: BackupRun['status'] | undefined): { title: string; body: string } {
  if (status === 'queued' || status === 'running' || status === 'uploading') {
    return {
      title: 'Remove stuck backup run?',
      body: 'Remove this backup run from history? Use this only when the job was cancelled or finished without updating status. If the job is still running, deletion will be rejected.',
    };
  }
  return {
    title: 'Delete failed backup?',
    body: 'Remove this failed backup run from history? This cannot be undone.',
  };
}

export function AdminBackupDeleteFailedModal({
  opened,
  runStatus,
  onClose,
  onConfirm,
  loading,
}: Props) {
  const copy = modalCopy(runStatus);

  return (
    <Modal opened={opened} onClose={onClose} title={copy.title} size="sm">
      <Stack gap="md">
        <Text size="sm">{copy.body}</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button color="red" loading={loading} onClick={onConfirm}>
            Remove
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
