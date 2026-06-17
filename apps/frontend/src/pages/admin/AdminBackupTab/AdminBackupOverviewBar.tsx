import { Badge, Button, Group, Text } from '@mantine/core';
import { IconSettings } from '@tabler/icons-react';
import type { BackupStatus } from './adminBackupTypes';

type Props = {
  status: BackupStatus;
  activeJobStatus: string | null;
  canBackup: boolean;
  backupLoading: boolean;
  onOpenSettings: () => void;
  onBackupNow: () => void;
};

export function AdminBackupOverviewBar({
  status,
  activeJobStatus,
  canBackup,
  backupLoading,
  onOpenSettings,
  onBackupNow,
}: Props) {
  return (
    <Group mb="md" justify="space-between" wrap="wrap" gap="sm" align="center">
      <Group gap="sm" wrap="wrap" align="center">
        <Badge color={status.minioAvailable ? 'green' : 'red'} variant="filled">
          MinIO {status.minioAvailable ? 'OK' : 'unavailable'}
        </Badge>
        <Badge color={status.workerConnected ? 'green' : 'yellow'} variant="filled">
          Job worker {status.workerConnected ? 'OK' : 'disconnected'}
        </Badge>
        {activeJobStatus ? (
          <Text size="sm" c={status.maintenanceReason === 'restore' ? 'orange' : 'blue'}>
            {activeJobStatus}
          </Text>
        ) : null}
      </Group>

      <Group gap="sm" align="center" wrap="nowrap">
        <Button
          size="xs"
          variant="default"
          leftSection={<IconSettings size={14} />}
          onClick={onOpenSettings}
        >
          Settings
        </Button>
        <Button size="xs" onClick={onBackupNow} loading={backupLoading} disabled={!canBackup}>
          Backup now
        </Button>
      </Group>
    </Group>
  );
}
