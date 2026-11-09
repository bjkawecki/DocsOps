import { useEffect, useState } from 'react';
import {
  ActionIcon,
  Button,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Switch,
  Tabs,
  Text,
  Tooltip,
} from '@mantine/core';
import { IconSettings } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { BackupRun, BackupStatus, Destination } from './adminBackupTypes';
import { formatBackupScheduleLabel } from './backupScheduleLabel';
import { AdminBackupRestorePanel } from './AdminBackupRestorePanel';

export type BackupSettingsTab = 'general' | 'restore';

type Props = {
  opened: boolean;
  onClose: () => void;
  initialTab?: BackupSettingsTab;
  status: BackupStatus;
  destinations: Destination[];
  backups: BackupRun[] | undefined;
  canEnableAuto: boolean;
  enableBlockReason: string | null;
  scheduleSaving: boolean;
  restoreFromBackupLoading: boolean;
  onRetentionChange: (value: number) => void;
  onDefaultDestinationChange: (value: string | null) => void;
  onAutoToggle: (enabled: boolean) => void;
  onRestoreFromBackup: (backupRunId: string) => void;
  onRestoreUploadComplete: (restoreRunId: string) => void;
};

export function AdminBackupSettingsModal({
  opened,
  onClose,
  initialTab = 'general',
  status,
  destinations,
  backups,
  canEnableAuto,
  enableBlockReason,
  scheduleSaving,
  restoreFromBackupLoading,
  onRetentionChange,
  onDefaultDestinationChange,
  onAutoToggle,
  onRestoreFromBackup,
  onRestoreUploadComplete,
}: Props) {
  const { t } = useTranslation(['admin', 'common']);
  const [activeTab, setActiveTab] = useState<string | null>(initialTab);

  useEffect(() => {
    if (opened) {
      setActiveTab(initialTab);
    }
  }, [opened, initialTab]);

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

  const handleRestoreFromBackup = (backupRunId: string) => {
    onRestoreFromBackup(backupRunId);
    onClose();
  };

  const handleRestoreUploadComplete = (restoreRunId: string) => {
    onRestoreUploadComplete(restoreRunId);
    onClose();
  };

  return (
    <Modal opened={opened} onClose={onClose} title={t('backup.settings.title')} size="lg">
      <Stack gap="md">
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="general">{t('backup.settings.tabGeneral')}</Tabs.Tab>
            <Tabs.Tab value="restore">{t('backup.settings.tabRestore')}</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="general" pt="md">
            <Stack gap="md">
              <NumberInput
                label={t('backup.settings.general.retentionLabel')}
                description={t('backup.settings.general.retentionDescription')}
                min={1}
                max={365}
                value={status.retentionCount}
                onChange={(v) => {
                  if (typeof v === 'number') onRetentionChange(v);
                }}
              />

              <Group gap={6} wrap="nowrap" align="flex-end">
                <Select
                  label={t('backup.settings.general.defaultDestinationLabel')}
                  placeholder={t('backup.settings.general.defaultDestinationPlaceholder')}
                  data={destinationOptions}
                  clearable
                  value={status.defaultDestinationId}
                  onChange={onDefaultDestinationChange}
                  style={{ flex: 1 }}
                />
                <Tooltip label={t('backup.overview.manageDestinations')}>
                  <ActionIcon
                    component={Link}
                    to="/admin/data/destinations"
                    variant="subtle"
                    color="gray"
                    size="lg"
                    mb={2}
                    aria-label={t('backup.overview.manageDestinations')}
                  >
                    <IconSettings size={18} />
                  </ActionIcon>
                </Tooltip>
              </Group>

              <Group justify="space-between" align="flex-end">
                <Tooltip
                  label={enableBlockReason ?? ''}
                  disabled={!enableBlockReason || status.schedule.enabled}
                >
                  <Switch
                    label={t('backup.settings.general.autoLabel')}
                    description={scheduleDetail ?? scheduleShortLabel}
                    checked={status.schedule.enabled}
                    disabled={scheduleSaving || (!status.schedule.enabled && !canEnableAuto)}
                    onChange={(e) => onAutoToggle(e.currentTarget.checked)}
                  />
                </Tooltip>
                {status.autoBackupConfigured ? (
                  <Text size="xs" c="dimmed">
                    <Link to="/admin/operations/scheduler">{t('backup.schedulerLink')}</Link>
                  </Text>
                ) : null}
              </Group>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="restore" pt="md">
            <AdminBackupRestorePanel
              backups={backups}
              maintenanceActive={status.maintenanceActive}
              restoreFromBackupLoading={restoreFromBackupLoading}
              onClose={onClose}
              onRestoreFromBackup={handleRestoreFromBackup}
              onUploadComplete={handleRestoreUploadComplete}
            />
          </Tabs.Panel>
        </Tabs>

        {activeTab !== 'restore' ? (
          <Group justify="flex-end">
            <Button variant="default" onClick={onClose}>
              {t('common:actions.close')}
            </Button>
          </Group>
        ) : null}
      </Stack>
    </Modal>
  );
}
