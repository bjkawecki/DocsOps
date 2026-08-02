import { Badge, Group, NumberInput, Select, Switch, Text, Tooltip } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { BackupStatus, Destination } from './adminBackupTypes';
import { formatBackupScheduleLabel } from './backupScheduleLabel';

type Props = {
  status: BackupStatus;
  destinations: Destination[];
  activeJobStatus: string | null;
  canEnableAuto: boolean;
  enableBlockReason: string | null;
  scheduleSaving: boolean;
  onRetentionChange: (value: number) => void;
  onDefaultDestinationChange: (value: string | null) => void;
  onAutoToggle: (enabled: boolean) => void;
};

export function AdminBackupOverviewBar({
  status,
  destinations,
  activeJobStatus,
  canEnableAuto,
  enableBlockReason,
  scheduleSaving,
  onRetentionChange,
  onDefaultDestinationChange,
  onAutoToggle,
}: Props) {
  const { t } = useTranslation('admin');
  const destinationOptions = destinations
    .filter((d) => d.enabled)
    .map((d) => ({ value: d.id, label: d.name }));

  const scheduleShortLabel = status.schedule.enabled
    ? formatBackupScheduleLabel(status.schedule.cron, status.schedule.tz, t)
    : t('backup.overview.notScheduled');
  const scheduleDetail =
    status.schedule.enabled && status.schedule.cron
      ? `${status.schedule.cron} (${status.schedule.tz ?? 'UTC'})`
      : null;

  return (
    <Group mb="md" justify="flex-start" wrap="wrap" gap="sm" align="center">
      <Badge color={status.minioAvailable ? 'green' : 'red'} variant="filled">
        {status.minioAvailable
          ? t('backup.overview.minioOk')
          : t('backup.overview.minioUnavailable')}
      </Badge>
      <Badge color={status.workerConnected ? 'green' : 'yellow'} variant="filled">
        {status.workerConnected
          ? t('backup.overview.workerOk')
          : t('backup.overview.workerDisconnected')}
      </Badge>

      <Tooltip label={t('backup.overview.retentionTooltip')}>
        <NumberInput
          size="xs"
          aria-label={t('backup.overview.retentionLabel')}
          placeholder={t('backup.overview.retentionLabel')}
          min={1}
          max={365}
          value={status.retentionCount}
          onChange={(v) => {
            if (typeof v === 'number') onRetentionChange(v);
          }}
          style={{ width: 88 }}
        />
      </Tooltip>

      <Select
        size="xs"
        placeholder={t('backup.overview.defaultDestinationLabel')}
        aria-label={t('backup.overview.defaultDestinationLabel')}
        data={destinationOptions}
        clearable
        value={status.defaultDestinationId}
        onChange={onDefaultDestinationChange}
        style={{ width: 180 }}
      />

      <Tooltip
        label={enableBlockReason ?? ''}
        disabled={!enableBlockReason || status.schedule.enabled}
      >
        <Switch
          size="sm"
          label={t('backup.overview.autoLabel')}
          checked={status.schedule.enabled}
          disabled={scheduleSaving || (!status.schedule.enabled && !canEnableAuto)}
          onChange={(e) => onAutoToggle(e.currentTarget.checked)}
        />
      </Tooltip>

      <Tooltip label={scheduleDetail ?? undefined} disabled={!scheduleDetail}>
        <Text size="sm" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
          {scheduleShortLabel}
          {status.autoBackupConfigured ? (
            <>
              {' · '}
              <Link to="/admin/operations/scheduler">{t('backup.schedulerLink')}</Link>
            </>
          ) : null}
        </Text>
      </Tooltip>

      {activeJobStatus ? (
        <Text size="sm" c={status.maintenanceReason === 'restore' ? 'orange' : 'blue'}>
          {activeJobStatus}
        </Text>
      ) : null}
    </Group>
  );
}
