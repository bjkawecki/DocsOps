import { Paper, Select, Stack, Switch, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import type { AdminSystemSettings } from 'backend/api-types';
import { usePatchAdminSystemSettings } from '../../../hooks/useAdminUpdateStatus.js';
import { AdminDemoReadOnlyAlert, useDemoMode } from '../AdminDemoReadOnlyAlert.js';

const INTERVAL_OPTIONS = [
  { value: '30', label: '30' },
  { value: '60', label: '60' },
  { value: '90', label: '90' },
  { value: '180', label: '180' },
  { value: '365', label: '365' },
] as const;

type Props = {
  settings: AdminSystemSettings;
};

export function AdminHealthCheckSettings({ settings }: Props) {
  const { t } = useTranslation('admin');
  const demoMode = useDemoMode();
  const patchMutation = usePatchAdminSystemSettings();
  const controlsDisabled = demoMode || patchMutation.isPending;

  const saveInterval = async (raw: string | null) => {
    if (demoMode || !raw) return;
    const days = Number(raw);
    if (![30, 60, 90, 180, 365].includes(days)) return;
    if (days === settings.healthCheckDefaultIntervalDays) return;
    try {
      await patchMutation.mutateAsync({
        healthCheckDefaultIntervalDays: days as 30 | 60 | 90 | 180 | 365,
      });
      notifications.show({
        color: 'green',
        message: t('healthCheck.saved'),
      });
    } catch {
      notifications.show({
        color: 'red',
        message: t('healthCheck.saveFailed'),
      });
    }
  };

  const saveAutoScan = async (enabled: boolean) => {
    if (demoMode) return;
    if (enabled === settings.healthCheckAutoScanEnabled) return;
    try {
      await patchMutation.mutateAsync({ healthCheckAutoScanEnabled: enabled });
      notifications.show({
        color: 'green',
        message: t('healthCheck.saved'),
      });
    } catch {
      notifications.show({
        color: 'red',
        message: t('healthCheck.saveFailed'),
      });
    }
  };

  return (
    <Stack gap="lg" maw={720}>
      <Stack gap="xs">
        <Title order={2}>{t('healthCheck.title')}</Title>
        <Text c="dimmed" size="sm">
          {t('healthCheck.intro')}
        </Text>
      </Stack>

      <AdminDemoReadOnlyAlert />

      <Paper withBorder p="md" radius="md">
        <fieldset
          disabled={demoMode}
          style={{ border: 'none', margin: 0, padding: 0, minInlineSize: 0 }}
        >
          <Stack gap="md">
            <Select
              label={t('healthCheck.defaultInterval')}
              description={t('healthCheck.defaultIntervalHint')}
              data={INTERVAL_OPTIONS.map((o) => ({
                value: o.value,
                label: t('healthCheck.daysOption', { count: Number(o.value) }),
              }))}
              value={String(settings.healthCheckDefaultIntervalDays)}
              onChange={(v) => void saveInterval(v)}
              disabled={controlsDisabled}
              allowDeselect={false}
            />
            <Switch
              label={t('healthCheck.autoScan')}
              description={t('healthCheck.autoScanHint')}
              checked={settings.healthCheckAutoScanEnabled}
              onChange={(e) => void saveAutoScan(e.currentTarget.checked)}
              disabled={controlsDisabled}
            />
          </Stack>
        </fieldset>
      </Paper>
    </Stack>
  );
}
