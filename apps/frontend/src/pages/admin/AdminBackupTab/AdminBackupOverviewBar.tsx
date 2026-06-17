import {
  Badge,
  Button,
  Group,
  NumberInput,
  Select,
  Stack,
  Switch,
  Text,
  Tooltip,
} from '@mantine/core';
import { Link } from 'react-router-dom';
import type { BackupStatus, Destination } from './adminBackupTypes';

type Props = {
  status: BackupStatus;
  destinations: Destination[];
  retentionCount: number;
  onRetentionChange: (value: number) => void;
  onDefaultDestinationChange: (value: string | null) => void;
  canBackup: boolean;
  canEnableAuto: boolean;
  enableBlockReason: string | null;
  scheduleSaving: boolean;
  backupLoading: boolean;
  onAutoToggle: (enabled: boolean) => void;
  onManageDestinations: () => void;
  onBackupNow: () => void;
};

export function AdminBackupOverviewBar({
  status,
  destinations,
  retentionCount,
  onRetentionChange,
  onDefaultDestinationChange,
  canBackup,
  canEnableAuto,
  enableBlockReason,
  scheduleSaving,
  backupLoading,
  onAutoToggle,
  onManageDestinations,
  onBackupNow,
}: Props) {
  const destinationOptions = destinations
    .filter((d) => d.enabled)
    .map((d) => ({ value: d.id, label: d.name }));

  const scheduleLabel = status.schedule.enabled
    ? status.schedule.cron
      ? `${status.schedule.cron} (${status.schedule.tz ?? 'UTC'})`
      : 'Daily at 03:00 UTC'
    : 'Not scheduled';

  return (
    <Stack gap="sm" mb="md">
      <Group justify="space-between" align="flex-start" wrap="wrap" gap="sm">
        <Stack gap="xs" style={{ flex: 1, minWidth: 280 }}>
          <Group gap="sm">
            <Badge color={status.minioAvailable ? 'green' : 'red'} variant="light">
              MinIO {status.minioAvailable ? 'OK' : 'unavailable'}
            </Badge>
            <Badge color={status.workerConnected ? 'green' : 'yellow'} variant="light">
              Worker {status.workerConnected ? 'OK' : 'disconnected'}
            </Badge>
            {status.maintenanceActive && (
              <Badge color="blue" variant="light">
                Maintenance
              </Badge>
            )}
          </Group>

          <Group gap="sm" align="flex-end" wrap="wrap">
            <NumberInput
              size="xs"
              label="Retention"
              description="Successful backups to keep"
              min={1}
              max={365}
              value={retentionCount}
              onChange={(v) => {
                if (typeof v === 'number') onRetentionChange(v);
              }}
              style={{ width: 100 }}
            />
            <Select
              size="xs"
              label="Default destination"
              placeholder="Select"
              data={destinationOptions}
              clearable
              value={status.defaultDestinationId}
              onChange={onDefaultDestinationChange}
              style={{ width: 200 }}
            />
          </Group>

          <Group gap="sm" align="center" wrap="wrap">
            <Tooltip
              label={enableBlockReason ?? ''}
              disabled={!enableBlockReason || status.schedule.enabled}
            >
              <Switch
                size="sm"
                label="Automatic backups"
                checked={status.schedule.enabled}
                disabled={scheduleSaving || (!status.schedule.enabled && !canEnableAuto)}
                onChange={(e) => onAutoToggle(e.currentTarget.checked)}
              />
            </Tooltip>
            <Text size="sm" c="dimmed">
              {scheduleLabel}
              {status.autoBackupConfigured && (
                <>
                  {' · '}
                  <Link to="/admin/scheduler">Scheduler</Link>
                </>
              )}
            </Text>
          </Group>
        </Stack>

        <Group gap="sm" align="flex-end" wrap="nowrap">
          <Button size="xs" variant="default" onClick={onManageDestinations}>
            Manage destinations
          </Button>
          <Button size="xs" onClick={onBackupNow} loading={backupLoading} disabled={!canBackup}>
            Backup now
          </Button>
        </Group>
      </Group>
    </Stack>
  );
}
