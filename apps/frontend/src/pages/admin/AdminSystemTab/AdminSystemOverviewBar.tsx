import { Anchor, Badge, Group, Popover, Switch, Text } from '@mantine/core';
import { IconExternalLink } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
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

function statusBadge(status: AdminSystemUpdateStatus, t: TFunction) {
  if (!status.updateCheckEnabled) {
    return (
      <Badge color="gray" variant="filled">
        {t('system.overviewBar.checksOff')}
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
            {t('system.overviewBar.checkFailed')}
          </Badge>
        </Popover.Target>
        <Popover.Dropdown>
          <Text size="sm" fw={600} mb={4}>
            {t('system.overviewBar.checkFailedTitle')}
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
      {t('system.overviewBar.upToDate')}
    </Badge>
  );
}

export function AdminSystemOverviewBar({
  status,
  checksEnabled,
  settingsSaving,
  onToggleChecks,
}: Props) {
  const { t } = useTranslation('admin');
  const lastChecked = formatCheckedAt(status.checkedAt);

  return (
    <Group mb="md" justify="flex-start" wrap="wrap" gap="sm" align="center">
      {statusBadge(status, t)}
      <Switch
        size="sm"
        label={t('system.overviewBar.automaticChecks')}
        checked={checksEnabled}
        disabled={settingsSaving}
        onChange={(event) => onToggleChecks(event.currentTarget.checked)}
      />
      {lastChecked != null ? (
        <Text size="sm" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
          {t('system.overviewBar.lastChecked', { time: lastChecked })}
        </Text>
      ) : (
        <Text size="sm" c="dimmed">
          {t('system.overviewBar.notCheckedYet')}
        </Text>
      )}
      {status.releaseUrl != null && (
        <Anchor href={status.releaseUrl} target="_blank" rel="noreferrer" size="sm">
          <Group gap={4} component="span">
            {t('system.overviewBar.githubRelease')}
            <IconExternalLink size={14} />
          </Group>
        </Anchor>
      )}
    </Group>
  );
}
