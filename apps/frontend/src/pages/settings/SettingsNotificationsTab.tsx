import { Alert, Button, Group, Loader, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SettingsContentCard } from './SettingsContentCard.js';
import { useMe } from '../../hooks/useMe';
import { SettingsCardTitle } from './SettingsCardTitle.js';
import { SettingsPreferenceSwitchRow } from './SettingsPreferenceSwitchRow.js';
import {
  SETTINGS_CARD_ROW_GAP,
  SETTINGS_CARD_STACK_GAP,
  closeSettingsSearchParams,
  settingsCardDomId,
} from './settingsLayout.js';
import { usePatchMePreferences } from './usePatchMePreferences.js';

type NotificationPrefKey =
  | 'documentChanges'
  | 'documentComments'
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

/** Comments used to share documentChanges; honour that until set explicitly. */
function readDocumentCommentsPref(
  channel: Record<string, boolean | undefined>,
  defaultValue: boolean
): boolean {
  if (channel.documentComments !== undefined) return channel.documentComments;
  if (channel.documentChanges !== undefined) return channel.documentChanges;
  return defaultValue;
}

export function SettingsNotificationsTab() {
  const { t } = useTranslation('settings');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: me, isPending: mePending, isError: meError, error: meErr } = useMe();

  const patchPreferences = usePatchMePreferences({
    toastKeys: {
      updatedTitle: 'notifications.toasts.updatedTitle',
      updatedMessage: 'notifications.toasts.updatedMessage',
      saveFailedTitle: 'notifications.toasts.saveFailedTitle',
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
        {meErr instanceof Error ? meErr.message : t('errors.loadFailed')}
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
              {t('notifications.openInbox')}
            </Button>
          </Group>
          <Text size="xs" c="dimmed">
            <strong>{t('notifications.labels.documentChanges')}</strong>{' '}
            {t('notifications.descriptions.documentChanges')}{' '}
            <strong>{t('notifications.labels.comments')}</strong>{' '}
            {t('notifications.descriptions.comments')}{' '}
            <strong>{t('notifications.labels.draftRequests')}</strong>{' '}
            {t('notifications.descriptions.draftRequests')}{' '}
            <strong>{t('notifications.labels.organization')}</strong>{' '}
            {t('notifications.descriptions.organization')}{' '}
            <strong>{t('notifications.labels.announcements')}</strong>{' '}
            {t('notifications.descriptions.announcements')}{' '}
            <strong>{t('notifications.labels.reminders')}</strong>{' '}
            {t('notifications.descriptions.reminders')}
          </Text>
          <Stack gap={SETTINGS_CARD_ROW_GAP}>
            <SettingsPreferenceSwitchRow
              label={t('notifications.labels.documentChanges')}
              checked={inApp.documentChanges ?? true}
              disabled={patchPreferences.isPending}
              onChange={(checked) => updateNotificationSetting('inApp', 'documentChanges', checked)}
            />
            <SettingsPreferenceSwitchRow
              label={t('notifications.labels.comments')}
              checked={readDocumentCommentsPref(inApp, true)}
              disabled={patchPreferences.isPending}
              onChange={(checked) =>
                updateNotificationSetting('inApp', 'documentComments', checked)
              }
            />
            <SettingsPreferenceSwitchRow
              label={t('notifications.labels.draftRequests')}
              checked={inApp.draftRequests ?? true}
              disabled={patchPreferences.isPending}
              onChange={(checked) => updateNotificationSetting('inApp', 'draftRequests', checked)}
            />
            <SettingsPreferenceSwitchRow
              label={t('notifications.labels.reminders')}
              checked={inApp.reminders ?? true}
              disabled={patchPreferences.isPending}
              onChange={(checked) => updateNotificationSetting('inApp', 'reminders', checked)}
            />
            <SettingsPreferenceSwitchRow
              label={t('notifications.labels.organization')}
              checked={inApp.orgChanges ?? true}
              disabled={patchPreferences.isPending}
              onChange={(checked) => updateNotificationSetting('inApp', 'orgChanges', checked)}
            />
            <SettingsPreferenceSwitchRow
              label={t('notifications.labels.announcements')}
              checked={readNotificationPref(inApp, 'announcements', true)}
              disabled={patchPreferences.isPending}
              onChange={(checked) => updateNotificationSetting('inApp', 'announcements', checked)}
            />
            {isAdmin && (
              <SettingsPreferenceSwitchRow
                label={t('notifications.labels.operations')}
                checked={readNotificationPref(inApp, 'operations', true)}
                disabled={patchPreferences.isPending}
                onChange={(checked) => updateNotificationSetting('inApp', 'operations', checked)}
              />
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
            <SettingsPreferenceSwitchRow
              label={t('notifications.labels.documentChanges')}
              checked={email.documentChanges ?? false}
              disabled={patchPreferences.isPending}
              onChange={(checked) => updateNotificationSetting('email', 'documentChanges', checked)}
            />
            <SettingsPreferenceSwitchRow
              label={t('notifications.labels.comments')}
              checked={readDocumentCommentsPref(email, false)}
              disabled={patchPreferences.isPending}
              onChange={(checked) =>
                updateNotificationSetting('email', 'documentComments', checked)
              }
            />
            <SettingsPreferenceSwitchRow
              label={t('notifications.labels.draftRequests')}
              checked={email.draftRequests ?? false}
              disabled={patchPreferences.isPending}
              onChange={(checked) => updateNotificationSetting('email', 'draftRequests', checked)}
            />
            <SettingsPreferenceSwitchRow
              label={t('notifications.labels.reminders')}
              checked={email.reminders ?? false}
              disabled={patchPreferences.isPending}
              onChange={(checked) => updateNotificationSetting('email', 'reminders', checked)}
            />
            <SettingsPreferenceSwitchRow
              label={t('notifications.labels.announcements')}
              checked={readNotificationPref(email, 'announcements', false)}
              disabled={patchPreferences.isPending}
              onChange={(checked) => updateNotificationSetting('email', 'announcements', checked)}
            />
            {isAdmin && (
              <SettingsPreferenceSwitchRow
                label={t('notifications.labels.operations')}
                checked={readNotificationPref(email, 'operations', false)}
                disabled={patchPreferences.isPending}
                onChange={(checked) => updateNotificationSetting('email', 'operations', checked)}
              />
            )}
            <SettingsPreferenceSwitchRow
              label={t('notifications.labels.organization')}
              checked={email.orgChanges ?? false}
              disabled={patchPreferences.isPending}
              onChange={(checked) => updateNotificationSetting('email', 'orgChanges', checked)}
            />
          </Stack>
        </Stack>
      </SettingsContentCard>
    </>
  );
}
