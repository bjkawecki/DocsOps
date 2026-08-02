import { Anchor, Badge, Group, Popover, Switch, Text } from '@mantine/core';
import { IconExternalLink } from '@tabler/icons-react';
import type { AdminSystemUpdateStatus } from 'backend/api-types';

type Props = {
  status: AdminSystemUpdateStatus;
  checksEnabled: boolean;
  settingsSaving: boolean;
  onToggleChecks: (enabled: boolean) => void;
};

function formatCheckedAt(iso: string | null): string | null {
  if (iso == null) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString();
}

function statusBadge(status: AdminSystemUpdateStatus) {
  if (!status.updateCheckEnabled) {
    return (
      <Badge color="gray" variant="filled">
        Checks off
      </Badge>
    );
  }
  if (status.checkError) {
    return (
      <Popover width={360} position="bottom-start" withArrow shadow="md">
        <Popover.Target>
          <Badge
            color="red"
            variant="filled"
            style={{ cursor: 'pointer' }}
            role="button"
            tabIndex={0}
          >
            Check failed
          </Badge>
        </Popover.Target>
        <Popover.Dropdown>
          <Text size="sm" fw={600} mb={4}>
            Update check failed
          </Text>
          <Text size="sm" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {status.checkError}
          </Text>
        </Popover.Dropdown>
      </Popover>
    );
  }
  if (status.updateAvailable) {
    return null;
  }
  return (
    <Badge color="green" variant="filled">
      Up to date
    </Badge>
  );
}

export function AdminSystemOverviewBar({
  status,
  checksEnabled,
  settingsSaving,
  onToggleChecks,
}: Props) {
  const lastChecked = formatCheckedAt(status.checkedAt);

  return (
    <Group mb="md" justify="flex-start" wrap="wrap" gap="sm" align="center">
      {statusBadge(status)}
      <Switch
        size="sm"
        label="Automatic checks"
        checked={checksEnabled}
        disabled={settingsSaving}
        onChange={(event) => onToggleChecks(event.currentTarget.checked)}
      />
      {lastChecked != null ? (
        <Text size="sm" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
          Last checked {lastChecked}
        </Text>
      ) : (
        <Text size="sm" c="dimmed">
          Not checked yet
        </Text>
      )}
      {status.releaseUrl != null && (
        <Anchor href={status.releaseUrl} target="_blank" rel="noreferrer" size="sm">
          <Group gap={4} component="span">
            GitHub release
            <IconExternalLink size={14} />
          </Group>
        </Anchor>
      )}
    </Group>
  );
}
