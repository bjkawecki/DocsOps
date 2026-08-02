import { Alert, Loader, Stack, Switch, Text } from '@mantine/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../api/client';
import type { UserPreferences } from '../../components/system/ThemeFromPreferences';
import { meQueryKey, useMe } from '../../hooks/useMe';
import { SettingsContentCard } from './SettingsContentCard.js';
import { SettingsCardTitle } from './SettingsCardTitle.js';
import {
  SETTINGS_CARD_ROW_GAP,
  SETTINGS_CARD_STACK_GAP,
  settingsCardDomId,
} from './settingsLayout.js';

type PulsePrefKey =
  | 'showDrafts'
  | 'showReviews'
  | 'showNewDocuments'
  | 'showUpdatedDocuments'
  | 'showComments';

const PULSE_SWITCH_KEYS: PulsePrefKey[] = [
  'showDrafts',
  'showReviews',
  'showNewDocuments',
  'showUpdatedDocuments',
  'showComments',
];

function readPulsePref(
  prefs: UserPreferences['pulseSettings'] | undefined,
  key: PulsePrefKey
): boolean {
  const value = prefs?.[key];
  return typeof value === 'boolean' ? value : true;
}

export function SettingsPulseTab() {
  const { t } = useTranslation('settings');
  const queryClient = useQueryClient();
  const { data: me, isPending: mePending, isError: meError, error: meErr } = useMe();

  const patchPreferences = useMutation({
    mutationFn: async (body: Partial<UserPreferences>) => {
      const res = await apiFetch('/api/v1/me/preferences', {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? 'Failed to save preferences');
      }
      return (await res.json()) as UserPreferences;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: meQueryKey });
      void queryClient.invalidateQueries({ queryKey: ['me', 'pulse'] });
      notifications.show({
        title: t('pulse.toasts.updatedTitle'),
        message: t('pulse.toasts.updatedMessage'),
        color: 'green',
      });
    },
    onError: (error: Error) => {
      notifications.show({
        title: t('pulse.toasts.saveFailedTitle'),
        message: error.message,
        color: 'red',
      });
    },
  });

  if (mePending) {
    return (
      <SettingsContentCard id={settingsCardDomId('pulse')} data-settings-card="pulse">
        <Loader size="sm" />
      </SettingsContentCard>
    );
  }
  if (meError || !me) {
    return (
      <Alert color="red" title="Error">
        {meErr instanceof Error ? meErr.message : t('errors.loadFailed')}
      </Alert>
    );
  }

  const pulse = me.preferences.pulseSettings;

  return (
    <SettingsContentCard id={settingsCardDomId('pulse')} data-settings-card="pulse">
      <Stack gap={SETTINGS_CARD_STACK_GAP}>
        <div>
          <SettingsCardTitle jumpId="pulse" />
          <Text size="sm" c="dimmed" mt={4}>
            {t('pulse.description')}
          </Text>
        </div>
        <Stack gap={SETTINGS_CARD_ROW_GAP}>
          {PULSE_SWITCH_KEYS.map((key) => (
            <Switch
              key={key}
              label={t(`pulse.switches.${key}.label`)}
              description={t(`pulse.switches.${key}.description`)}
              checked={readPulsePref(pulse, key)}
              disabled={patchPreferences.isPending}
              onChange={(e) => {
                patchPreferences.mutate({
                  pulseSettings: { [key]: e.currentTarget.checked },
                });
              }}
            />
          ))}
        </Stack>
      </Stack>
    </SettingsContentCard>
  );
}
