import {
  Alert,
  Button,
  Group,
  Loader,
  Modal,
  PasswordInput,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { useEffect, useState, type SubmitEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../api/client';
import { SettingsContentCard } from './SettingsContentCard.js';
import { meQueryKey, useMe } from '../../hooks/useMe';
import {
  SETTINGS_CARD_STACK_GAP,
  SETTINGS_FIELD_LABEL_GAP,
  settingsCardDomId,
} from './settingsLayout.js';
import { SettingsCardTitle } from './SettingsCardTitle.js';

const MIN_PASSWORD_LENGTH = 8;

export function SettingsAccountTab() {
  const { t } = useTranslation('settings');
  const queryClient = useQueryClient();
  const [changeEmailOpened, { open: openChangeEmail, close: closeChangeEmail }] =
    useDisclosure(false);
  const [changePasswordOpened, { open: openChangePassword, close: closeChangePassword }] =
    useDisclosure(false);
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { data, isPending, isError, error } = useMe();

  useEffect(() => {
    if (changeEmailOpened && data) {
      setNewEmail(data.user.email ?? '');
    }
  }, [changeEmailOpened, data]);

  const patchAccount = useMutation({
    mutationFn: async (body: {
      email?: string | null;
      currentPassword?: string;
      newPassword?: string;
    }) => {
      const res = await apiFetch('/api/v1/me/account', {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? res.statusText);
      }
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: meQueryKey });
      if (variables.newPassword !== undefined) {
        notifications.show({
          title: t('account.toasts.passwordUpdatedTitle'),
          message: t('account.toasts.passwordUpdatedMessage'),
          color: 'green',
        });
        closeChangePassword();
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
      if (variables.email !== undefined) {
        notifications.show({
          title: t('account.toasts.emailUpdatedTitle'),
          message: t('account.toasts.emailUpdatedMessage'),
          color: 'green',
        });
        closeChangeEmail();
        setNewEmail('');
        setCurrentPassword('');
      }
    },
    onError: (err: Error) => {
      notifications.show({
        title: t('account.toasts.updateFailedTitle'),
        message: err.message,
        color: 'red',
      });
    },
  });

  const handleSubmitChangeEmail = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    patchAccount.mutate({ email: newEmail.trim(), currentPassword });
  };

  const handleSubmitChangePassword = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      notifications.show({
        title: t('account.toasts.passwordMismatchTitle'),
        message: t('account.toasts.passwordMismatchMessage'),
        color: 'red',
      });
      return;
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      notifications.show({
        title: t('account.toasts.passwordTooShortTitle'),
        message: t('account.toasts.passwordTooShortMessage', { count: MIN_PASSWORD_LENGTH }),
        color: 'red',
      });
      return;
    }
    patchAccount.mutate({ currentPassword, newPassword });
  };

  if (isPending || !data) {
    return (
      <>
        <SettingsContentCard id={settingsCardDomId('email')} data-settings-card="email">
          <Loader size="sm" />
        </SettingsContentCard>
        <SettingsContentCard id={settingsCardDomId('password')} data-settings-card="password">
          <Loader size="sm" />
        </SettingsContentCard>
      </>
    );
  }
  if (isError) {
    return (
      <Alert color="red" title="Error">
        {error?.message}
      </Alert>
    );
  }

  const { user } = data;
  const hasLocalLogin = user.hasLocalLogin ?? false;

  return (
    <>
      <SettingsContentCard id={settingsCardDomId('email')} data-settings-card="email">
        <Stack gap={SETTINGS_CARD_STACK_GAP}>
          <Group justify="space-between" align="flex-start" wrap="nowrap" gap="md">
            <SettingsCardTitle jumpId="email" />
            <Button variant="default" size="xs" onClick={openChangeEmail} disabled={!hasLocalLogin}>
              {t('account.changeEmail')}
            </Button>
          </Group>
          <Stack gap={SETTINGS_FIELD_LABEL_GAP}>
            <Text size="sm" fw={500} style={{ fontFamily: 'monospace' }}>
              {hasLocalLogin ? (user.email ?? '–') : '–'}
            </Text>
            <Text size="xs" c="dimmed">
              {hasLocalLogin ? t('account.loginEmailDescription') : t('account.ssoManagedEmail')}
            </Text>
          </Stack>
        </Stack>
      </SettingsContentCard>

      <SettingsContentCard id={settingsCardDomId('password')} data-settings-card="password">
        <Stack gap={SETTINGS_CARD_STACK_GAP}>
          <Group justify="space-between" align="flex-start" wrap="nowrap" gap="md">
            <SettingsCardTitle jumpId="password" />
            <Button
              variant="default"
              size="xs"
              onClick={openChangePassword}
              disabled={!hasLocalLogin}
            >
              {t('account.changePassword')}
            </Button>
          </Group>
          <Stack gap={SETTINGS_FIELD_LABEL_GAP}>
            <Text size="sm" fw={500} style={{ fontFamily: 'monospace', letterSpacing: 2 }}>
              {hasLocalLogin ? '**********' : '–'}
            </Text>
            <Text size="xs" c="dimmed">
              {hasLocalLogin
                ? t('account.changePasswordDescription')
                : t('account.ssoManagedPassword')}
            </Text>
          </Stack>
        </Stack>
      </SettingsContentCard>

      <Modal
        opened={changeEmailOpened}
        onClose={closeChangeEmail}
        title={t('account.changeEmailModal.title')}
      >
        <form onSubmit={handleSubmitChangeEmail}>
          <Stack gap={SETTINGS_CARD_STACK_GAP}>
            <TextInput
              label={t('account.changeEmailModal.newEmailLabel')}
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.currentTarget.value)}
              required
              placeholder="you@example.com"
            />
            <PasswordInput
              label={t('account.changeEmailModal.currentPasswordLabel')}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.currentTarget.value)}
              required
            />
            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={closeChangeEmail}>
                {t('account.changeEmailModal.cancel')}
              </Button>
              <Button type="submit" loading={patchAccount.isPending}>
                {t('account.changeEmailModal.save')}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <Modal
        opened={changePasswordOpened}
        onClose={closeChangePassword}
        title={t('account.changePasswordModal.title')}
      >
        <form onSubmit={handleSubmitChangePassword}>
          <Stack gap={SETTINGS_CARD_STACK_GAP}>
            <PasswordInput
              label={t('account.changePasswordModal.currentPasswordLabel')}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.currentTarget.value)}
              required
            />
            <PasswordInput
              label={t('account.changePasswordModal.newPasswordLabel')}
              value={newPassword}
              onChange={(e) => setNewPassword(e.currentTarget.value)}
              required
              minLength={MIN_PASSWORD_LENGTH}
              description={t('account.changePasswordModal.newPasswordDescription', {
                count: MIN_PASSWORD_LENGTH,
              })}
            />
            <PasswordInput
              label={t('account.changePasswordModal.confirmPasswordLabel')}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.currentTarget.value)}
              required
              minLength={MIN_PASSWORD_LENGTH}
            />
            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={closeChangePassword}>
                {t('account.changePasswordModal.cancel')}
              </Button>
              <Button type="submit" loading={patchAccount.isPending}>
                {t('account.changePasswordModal.save')}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
