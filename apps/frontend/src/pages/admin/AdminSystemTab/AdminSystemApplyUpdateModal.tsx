import { Button, Group, Modal, Stack, Text } from '@mantine/core';
import { useEffect, useState } from 'react';
import type { AdminSystemUpdateStatus, AdminUpdateRun } from 'backend/api-types';
import { useApplySystemUpdate, usePollUpdateRun } from '../../../hooks/useAdminUpdateStatus.js';

type Props = {
  opened: boolean;
  onClose: () => void;
  status: AdminSystemUpdateStatus;
};

function statusLabel(run: AdminUpdateRun): string {
  switch (run.status) {
    case 'backing_up':
      return 'Creating backup…';
    case 'applying':
      return 'Applying update…';
    case 'succeeded':
      return 'Update completed successfully.';
    case 'failed':
      return run.errorMessage ?? 'Update failed.';
    default:
      return 'Preparing update…';
  }
}

export function AdminSystemApplyUpdateModal({ opened, onClose, status }: Props) {
  const [updateRunId, setUpdateRunId] = useState<string | null>(null);
  const applyMutation = useApplySystemUpdate();
  const pollQuery = usePollUpdateRun(updateRunId, { enabled: opened && updateRunId != null });

  const activeRun = pollQuery.data;
  const inProgress =
    activeRun != null &&
    (activeRun.status === 'queued' ||
      activeRun.status === 'backing_up' ||
      activeRun.status === 'applying');

  useEffect(() => {
    if (!opened) {
      setUpdateRunId(null);
    }
  }, [opened]);

  useEffect(() => {
    if (status.activeUpdateRun?.id && opened && updateRunId == null) {
      setUpdateRunId(status.activeUpdateRun.id);
    }
  }, [opened, status.activeUpdateRun?.id, updateRunId]);

  const handleClose = () => {
    if (inProgress) return;
    onClose();
  };

  const handleApply = async () => {
    try {
      const result = await applyMutation.mutateAsync();
      setUpdateRunId(result.updateRunId);
    } catch {
      // parent may show notification
    }
  };

  const tag = status.latestReleaseTag ?? 'vX.Y.Z';

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={updateRunId ? 'Update in progress' : 'Apply update'}
      size="md"
      closeOnClickOutside={!inProgress}
      closeOnEscape={!inProgress}
    >
      {updateRunId == null ? (
        <Stack gap="md">
          <Text size="sm">
            A backup will be created automatically, then DocsOps will upgrade to{' '}
            <strong>{tag}</strong>. Write operations are blocked during the update.
          </Text>
          <Text size="sm" c="dimmed">
            This may take several minutes depending on database size and backup destination.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={handleClose}>
              Cancel
            </Button>
            <Button loading={applyMutation.isPending} onClick={() => void handleApply()}>
              Start update
            </Button>
          </Group>
        </Stack>
      ) : (
        <Stack gap="md">
          <Text size="sm">{activeRun ? statusLabel(activeRun) : 'Loading status…'}</Text>
          {activeRun?.status === 'succeeded' ? (
            <Text size="sm" c="dimmed">
              The application has been upgraded. You may need to reload this page.
            </Text>
          ) : null}
          {activeRun?.status === 'failed' ? (
            <Text size="sm" c="red">
              {activeRun.errorMessage ?? 'The update could not be completed.'}
            </Text>
          ) : null}
          <Group justify="flex-end">
            <Button disabled={inProgress} onClick={handleClose}>
              {inProgress ? 'Please wait…' : 'Close'}
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}
