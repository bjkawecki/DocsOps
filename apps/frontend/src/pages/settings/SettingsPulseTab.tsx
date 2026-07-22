import { Alert, Loader, Stack, Switch, Text } from '@mantine/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
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

const PULSE_SWITCHES: Array<{ key: PulsePrefKey; label: string; description: string }> = [
  {
    key: 'showDrafts',
    label: 'Open drafts',
    description: 'Your unpublished documents that still need work.',
  },
  {
    key: 'showReviews',
    label: 'Reviews',
    description: 'Items awaiting your review and decisions on your requests.',
  },
  {
    key: 'showNewDocuments',
    label: 'New documents',
    description: 'Newly published or created documents you can read.',
  },
  {
    key: 'showUpdatedDocuments',
    label: 'Updated documents',
    description: 'Published documents with unread updates.',
  },
  {
    key: 'showComments',
    label: 'Comments',
    description: 'Unread comment activity on documents.',
  },
];

function readPulsePref(
  prefs: UserPreferences['pulseSettings'] | undefined,
  key: PulsePrefKey
): boolean {
  const value = prefs?.[key];
  return typeof value === 'boolean' ? value : true;
}

export function SettingsPulseTab() {
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
        title: 'Pulse updated',
        message: 'Your Home pulse preferences were saved.',
        color: 'green',
      });
    },
    onError: (error: Error) => {
      notifications.show({ title: 'Save failed', message: error.message, color: 'red' });
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
        {meErr instanceof Error ? meErr.message : 'Failed to load settings'}
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
            Choose what appears on Home. Independent from notification delivery.
          </Text>
        </div>
        <Stack gap={SETTINGS_CARD_ROW_GAP}>
          {PULSE_SWITCHES.map((row) => (
            <Switch
              key={row.key}
              label={row.label}
              description={row.description}
              checked={readPulsePref(pulse, row.key)}
              disabled={patchPreferences.isPending}
              onChange={(e) => {
                patchPreferences.mutate({
                  pulseSettings: { [row.key]: e.currentTarget.checked },
                });
              }}
            />
          ))}
        </Stack>
      </Stack>
    </SettingsContentCard>
  );
}
