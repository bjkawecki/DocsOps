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
          title: 'Password updated',
          message: 'Your password has been changed.',
          color: 'green',
        });
        closeChangePassword();
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
      if (variables.email !== undefined) {
        notifications.show({
          title: 'Email updated',
          message: 'Your email has been updated.',
          color: 'green',
        });
        closeChangeEmail();
        setNewEmail('');
        setCurrentPassword('');
      }
    },
    onError: (err: Error) => {
      notifications.show({ title: 'Update failed', message: err.message, color: 'red' });
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
        title: 'Passwords do not match',
        message: 'Please confirm your new password.',
        color: 'red',
      });
      return;
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      notifications.show({
        title: 'Password too short',
        message: `At least ${MIN_PASSWORD_LENGTH} characters required.`,
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
              Change email
            </Button>
          </Group>
          <Stack gap={SETTINGS_FIELD_LABEL_GAP}>
            <Text size="sm" fw={500} style={{ fontFamily: 'monospace' }}>
              {hasLocalLogin ? (user.email ?? '–') : '–'}
            </Text>
            <Text size="xs" c="dimmed">
              {hasLocalLogin
                ? 'Your login email. You need your current password to change it.'
                : 'Managed by SSO. Cannot be changed here.'}
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
              Change password
            </Button>
          </Group>
          <Stack gap={SETTINGS_FIELD_LABEL_GAP}>
            <Text size="sm" fw={500} style={{ fontFamily: 'monospace', letterSpacing: 2 }}>
              {hasLocalLogin ? '**********' : '–'}
            </Text>
            <Text size="xs" c="dimmed">
              {hasLocalLogin
                ? 'Change your password. You will need your current password.'
                : 'Managed by SSO. Cannot be changed here.'}
            </Text>
          </Stack>
        </Stack>
      </SettingsContentCard>

      <Modal opened={changeEmailOpened} onClose={closeChangeEmail} title="Change email">
        <form onSubmit={handleSubmitChangeEmail}>
          <Stack gap={SETTINGS_CARD_STACK_GAP}>
            <TextInput
              label="New email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.currentTarget.value)}
              required
              placeholder="you@example.com"
            />
            <PasswordInput
              label="Current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.currentTarget.value)}
              required
            />
            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={closeChangeEmail}>
                Cancel
              </Button>
              <Button type="submit" loading={patchAccount.isPending}>
                Save
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <Modal opened={changePasswordOpened} onClose={closeChangePassword} title="Change password">
        <form onSubmit={handleSubmitChangePassword}>
          <Stack gap={SETTINGS_CARD_STACK_GAP}>
            <PasswordInput
              label="Current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.currentTarget.value)}
              required
            />
            <PasswordInput
              label="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.currentTarget.value)}
              required
              minLength={MIN_PASSWORD_LENGTH}
              description={`At least ${MIN_PASSWORD_LENGTH} characters`}
            />
            <PasswordInput
              label="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.currentTarget.value)}
              required
              minLength={MIN_PASSWORD_LENGTH}
            />
            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={closeChangePassword}>
                Cancel
              </Button>
              <Button type="submit" loading={patchAccount.isPending}>
                Save
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
