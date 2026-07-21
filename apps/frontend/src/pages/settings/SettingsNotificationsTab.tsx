import { Alert, Button, Group, Loader, Stack, Switch, Text } from '@mantine/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../../api/client';
import type { UserPreferences } from '../../components/system/ThemeFromPreferences';
import { SettingsContentCard } from './SettingsContentCard.js';
import { meQueryKey, useMe } from '../../hooks/useMe';
import { SettingsCardTitle } from './SettingsCardTitle.js';
import {
  SETTINGS_CARD_ROW_GAP,
  SETTINGS_CARD_STACK_GAP,
  closeSettingsSearchParams,
  settingsCardDomId,
} from './settingsLayout.js';

type NotificationPrefKey =
  | 'documentChanges'
  | 'draftRequests'
  | 'reminders'
  | 'announcements'
  | 'operations'
  | 'orgChanges';

function readNotificationPref(
  channel: Record<string, boolean | undefined>,
  key: 'announcements' | 'operations',
  defaultValue: boolean
): boolean {
  const value = channel[key];
  if (value !== undefined) return value;
  const legacy = channel.system;
  if (legacy !== undefined) return legacy;
  return defaultValue;
}

export function SettingsNotificationsTab() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
      notifications.show({
        title: 'Notifications updated',
        message: 'Your notification preferences were saved.',
        color: 'green',
      });
    },
    onError: (error: Error) => {
      notifications.show({ title: 'Save failed', message: error.message, color: 'red' });
    },
  });

  const updateNotificationSetting = (
    channel: 'inApp' | 'email',
    key: NotificationPrefKey,
    value: boolean
  ) => {
    patchPreferences.mutate({
      notificationSettings: {
        [channel]: {
          [key]: value,
        },
      },
    });
  };

  if (mePending) {
    return (
      <>
        <SettingsContentCard
          id={settingsCardDomId('notifications-in-app')}
          data-settings-card="notifications-in-app"
        >
          <Loader size="sm" />
        </SettingsContentCard>
        <SettingsContentCard
          id={settingsCardDomId('notifications-email')}
          data-settings-card="notifications-email"
        >
          <Loader size="sm" />
        </SettingsContentCard>
      </>
    );
  }
  if (meError || !me) {
    return (
      <Alert color="red" title="Error">
        {meErr instanceof Error ? meErr.message : 'Failed to load settings'}
      </Alert>
    );
  }

  const isAdmin = me.user.isAdmin === true;
  const prefs = me.preferences.notificationSettings ?? {};
  const inApp = prefs.inApp ?? {};
  const email = prefs.email ?? {};

  return (
    <>
      <SettingsContentCard
        id={settingsCardDomId('notifications-in-app')}
        data-settings-card="notifications-in-app"
      >
        <Stack gap={SETTINGS_CARD_STACK_GAP}>
          <Group justify="space-between" align="flex-start" wrap="nowrap" gap="md">
            <SettingsCardTitle jumpId="notifications-in-app" />
            <Button
              variant="default"
              size="xs"
              onClick={() => {
                const next = closeSettingsSearchParams(searchParams);
                const qs = next.toString();
                void navigate(qs.length > 0 ? `/notifications?${qs}` : '/notifications');
              }}
            >
              Open inbox
            </Button>
          </Group>
          <Text size="xs" c="dimmed">
            <strong>Document changes</strong> covers publish, visible updates to published
            documents, archive/trash/restore, and sharing changes (grants).{' '}
            <strong>Draft requests</strong> covers the review workflow.{' '}
            <strong>Organization</strong> covers team membership and lead roles.{' '}
            <strong>Announcements</strong> covers admin broadcasts. <strong>Reminders</strong> is
            reserved for future use.
          </Text>
          <Stack gap={SETTINGS_CARD_ROW_GAP}>
            <Group justify="space-between" wrap="nowrap" gap="md">
              <Text size="sm" fw={500} style={{ flex: 1, minWidth: 0 }}>
                Document changes
              </Text>
              <Switch
                checked={inApp.documentChanges ?? true}
                onChange={(event) =>
                  updateNotificationSetting('inApp', 'documentChanges', event.currentTarget.checked)
                }
                disabled={patchPreferences.isPending}
              />
            </Group>
            <Group justify="space-between" wrap="nowrap" gap="md">
              <Text size="sm" fw={500} style={{ flex: 1, minWidth: 0 }}>
                Draft requests
              </Text>
              <Switch
                checked={inApp.draftRequests ?? true}
                onChange={(event) =>
                  updateNotificationSetting('inApp', 'draftRequests', event.currentTarget.checked)
                }
                disabled={patchPreferences.isPending}
              />
            </Group>
            <Group justify="space-between" wrap="nowrap" gap="md">
              <Text size="sm" fw={500} style={{ flex: 1, minWidth: 0 }}>
                Reminders
              </Text>
              <Switch
                checked={inApp.reminders ?? true}
                onChange={(event) =>
                  updateNotificationSetting('inApp', 'reminders', event.currentTarget.checked)
                }
                disabled={patchPreferences.isPending}
              />
            </Group>
            <Group justify="space-between" wrap="nowrap" gap="md">
              <Text size="sm" fw={500} style={{ flex: 1, minWidth: 0 }}>
                Organization
              </Text>
              <Switch
                checked={inApp.orgChanges ?? true}
                onChange={(event) =>
                  updateNotificationSetting('inApp', 'orgChanges', event.currentTarget.checked)
                }
                disabled={patchPreferences.isPending}
              />
            </Group>
            <Group justify="space-between" wrap="nowrap" gap="md">
              <Text size="sm" fw={500} style={{ flex: 1, minWidth: 0 }}>
                Announcements
              </Text>
              <Switch
                checked={readNotificationPref(inApp, 'announcements', true)}
                onChange={(event) =>
                  updateNotificationSetting('inApp', 'announcements', event.currentTarget.checked)
                }
                disabled={patchPreferences.isPending}
              />
            </Group>
            {isAdmin && (
              <Group justify="space-between" wrap="nowrap" gap="md">
                <Text size="sm" fw={500} style={{ flex: 1, minWidth: 0 }}>
                  Operations
                </Text>
                <Switch
                  checked={readNotificationPref(inApp, 'operations', true)}
                  onChange={(event) =>
                    updateNotificationSetting('inApp', 'operations', event.currentTarget.checked)
                  }
                  disabled={patchPreferences.isPending}
                />
              </Group>
            )}
          </Stack>
        </Stack>
      </SettingsContentCard>

      <SettingsContentCard
        id={settingsCardDomId('notifications-email')}
        data-settings-card="notifications-email"
      >
        <Stack gap={SETTINGS_CARD_STACK_GAP}>
          <SettingsCardTitle jumpId="notifications-email" />
          <Stack gap={SETTINGS_CARD_ROW_GAP}>
            <Group justify="space-between" wrap="nowrap" gap="md">
              <Text size="sm" fw={500} style={{ flex: 1, minWidth: 0 }}>
                Document changes
              </Text>
              <Switch
                checked={email.documentChanges ?? false}
                onChange={(event) =>
                  updateNotificationSetting('email', 'documentChanges', event.currentTarget.checked)
                }
                disabled={patchPreferences.isPending}
              />
            </Group>
            <Group justify="space-between" wrap="nowrap" gap="md">
              <Text size="sm" fw={500} style={{ flex: 1, minWidth: 0 }}>
                Draft requests
              </Text>
              <Switch
                checked={email.draftRequests ?? false}
                onChange={(event) =>
                  updateNotificationSetting('email', 'draftRequests', event.currentTarget.checked)
                }
                disabled={patchPreferences.isPending}
              />
            </Group>
            <Group justify="space-between" wrap="nowrap" gap="md">
              <Text size="sm" fw={500} style={{ flex: 1, minWidth: 0 }}>
                Reminders
              </Text>
              <Switch
                checked={email.reminders ?? false}
                onChange={(event) =>
                  updateNotificationSetting('email', 'reminders', event.currentTarget.checked)
                }
                disabled={patchPreferences.isPending}
              />
            </Group>
            <Group justify="space-between" wrap="nowrap" gap="md">
              <Text size="sm" fw={500} style={{ flex: 1, minWidth: 0 }}>
                Announcements
              </Text>
              <Switch
                checked={readNotificationPref(email, 'announcements', false)}
                onChange={(event) =>
                  updateNotificationSetting('email', 'announcements', event.currentTarget.checked)
                }
                disabled={patchPreferences.isPending}
              />
            </Group>
            {isAdmin && (
              <Group justify="space-between" wrap="nowrap" gap="md">
                <Text size="sm" fw={500} style={{ flex: 1, minWidth: 0 }}>
                  Operations
                </Text>
                <Switch
                  checked={readNotificationPref(email, 'operations', false)}
                  onChange={(event) =>
                    updateNotificationSetting('email', 'operations', event.currentTarget.checked)
                  }
                  disabled={patchPreferences.isPending}
                />
              </Group>
            )}
            <Group justify="space-between" wrap="nowrap" gap="md">
              <Text size="sm" fw={500} style={{ flex: 1, minWidth: 0 }}>
                Organization
              </Text>
              <Switch
                checked={email.orgChanges ?? false}
                onChange={(event) =>
                  updateNotificationSetting('email', 'orgChanges', event.currentTarget.checked)
                }
                disabled={patchPreferences.isPending}
              />
            </Group>
          </Stack>
        </Stack>
      </SettingsContentCard>
    </>
  );
}
