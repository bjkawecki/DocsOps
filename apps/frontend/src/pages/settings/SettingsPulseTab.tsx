import { Alert, Loader, Stack, Switch, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { UserPreferences } from '../../components/system/ThemeFromPreferences';
import { useMe } from '../../hooks/useMe';
import { SettingsContentCard } from './SettingsContentCard.js';
import { SettingsCardTitle } from './SettingsCardTitle.js';
import {
  SETTINGS_CARD_ROW_GAP,
  SETTINGS_CARD_STACK_GAP,
  settingsCardDomId,
} from './settingsLayout.js';
import { usePatchMePreferences } from './usePatchMePreferences.js';

type PulsePrefKey =
  'showDrafts' | 'showReviews' | 'showNewDocuments' | 'showUpdatedDocuments' | 'showComments';

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
  const { data: me, isPending: mePending, isError: meError, error: meErr } = useMe();

  const patchPreferences = usePatchMePreferences({
    toastKeys: {
      updatedTitle: 'pulse.toasts.updatedTitle',
      updatedMessage: 'pulse.toasts.updatedMessage',
      saveFailedTitle: 'pulse.toasts.saveFailedTitle',
    },
    extraInvalidateKeys: [['me', 'pulse']],
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
