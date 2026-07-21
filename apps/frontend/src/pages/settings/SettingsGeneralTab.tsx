import {
  ActionIcon,
  Alert,
  Button,
  Group,
  List,
  Loader,
  Menu,
  Modal,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { IconDotsVertical } from '@tabler/icons-react';
import { useEffect, useState, type SubmitEvent } from 'react';
import { apiFetch } from '../../api/client';
import { SettingsContentCard } from './SettingsContentCard.js';
import { meQueryKey, useMe } from '../../hooks/useMe';
import { SettingsCardTitle } from './SettingsCardTitle.js';
import {
  SETTINGS_CARD_ROW_GAP,
  SETTINGS_CARD_STACK_GAP,
  SETTINGS_FIELD_LABEL_GAP,
  settingsCardDomId,
} from './settingsLayout.js';

export function SettingsGeneralTab() {
  const queryClient = useQueryClient();
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const [deactivateOpened, { open: openDeactivate, close: closeDeactivate }] = useDisclosure(false);
  const [name, setName] = useState('');

  const { data, isPending, isError, error } = useMe();

  useEffect(() => {
    if (data) {
      setName(data.user.name);
    }
  }, [data]);

  const patchMe = useMutation({
    mutationFn: async (body: { name: string }) => {
      const res = await apiFetch('/api/v1/me', {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? res.statusText);
      }
      return (await res.json()) as { name: string };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: meQueryKey });
      notifications.show({
        title: 'Profile updated',
        message: 'Your profile has been saved.',
        color: 'green',
      });
      closeEdit();
    },
    onError: (err: Error) => {
      notifications.show({ title: 'Update failed', message: err.message, color: 'red' });
    },
  });

  const deactivateMe = useMutation({
    mutationFn: async () => {
      const res = await apiFetch('/api/v1/me/deactivate', { method: 'POST' });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? res.statusText);
      }
    },
    onSuccess: async () => {
      closeDeactivate();
      notifications.show({
        title: 'Account deactivated',
        message: 'You have been logged out. An administrator can reactivate your account.',
        color: 'green',
      });
      await apiFetch('/api/v1/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    },
    onError: (err: Error) => {
      notifications.show({ title: 'Deactivation failed', message: err.message, color: 'red' });
    },
  });

  const handleSubmitEdit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    patchMe.mutate({ name });
  };

  if (isPending || !data) {
    return (
      <>
        <SettingsContentCard id={settingsCardDomId('profile')} data-settings-card="profile">
          <Loader size="sm" />
        </SettingsContentCard>
        <SettingsContentCard id={settingsCardDomId('identity')} data-settings-card="identity">
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

  const { user, identity } = data;

  return (
    <>
      <SettingsContentCard id={settingsCardDomId('profile')} data-settings-card="profile">
        <Stack gap={SETTINGS_CARD_STACK_GAP}>
          <Group justify="space-between" align="flex-start" wrap="nowrap" gap="md">
            <SettingsCardTitle jumpId="profile" />
            <Menu shadow="md" position="bottom-end">
              <Menu.Target>
                <ActionIcon variant="subtle" size="md" aria-label="Profile actions">
                  <IconDotsVertical size={18} stroke={3} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item onClick={openEdit}>Edit Profile</Menu.Item>
                <Menu.Item color="red" onClick={openDeactivate}>
                  Deactivate
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
          <Stack gap={SETTINGS_FIELD_LABEL_GAP}>
            <Text size="lg" fw={500}>
              {user.name}
            </Text>
            {user.isAdmin && (
              <Text size="sm" c="dimmed">
                Admin User
              </Text>
            )}
            {user.email != null && user.email !== '' && user.email !== user.name && (
              <Text size="sm" c="dimmed">
                {user.email}
              </Text>
            )}
          </Stack>
        </Stack>
      </SettingsContentCard>

      <SettingsContentCard id={settingsCardDomId('identity')} data-settings-card="identity">
        <Stack gap={SETTINGS_CARD_STACK_GAP}>
          <SettingsCardTitle jumpId="identity" />
          <Stack gap={SETTINGS_CARD_ROW_GAP}>
            <div>
              <Text size="sm" fw={500} mb={4}>
                User Entity
              </Text>
              <Text size="sm" c="dimmed">
                {user.isAdmin ? 'Admin User' : 'User'}
              </Text>
            </div>
            <div>
              <Text size="sm" fw={500} mb={4}>
                Ownership Entities
              </Text>
              {identity.teams.length > 0 ||
              identity.departmentLeads.length > 0 ||
              identity.departmentAuthors.length > 0 ||
              identity.companyLeads?.length > 0 ? (
                <List size="sm">
                  {identity.teams.map((t) => (
                    <List.Item key={t.teamId}>
                      {t.teamName} ({t.departmentName}) –{' '}
                      {t.role === 'leader'
                        ? 'Team Lead'
                        : t.role === 'author'
                          ? 'Team Author'
                          : 'Member'}
                    </List.Item>
                  ))}
                  {identity.departmentLeads.map((d) => (
                    <List.Item key={d.id}>Department Lead: {d.name}</List.Item>
                  ))}
                  {identity.departmentAuthors.map((d) => (
                    <List.Item key={d.id}>Department Author: {d.name}</List.Item>
                  ))}
                  {identity.companyLeads?.map((c) => (
                    <List.Item key={c.id}>Company Lead: {c.name}</List.Item>
                  ))}
                </List>
              ) : (
                <Text size="sm" c="dimmed">
                  –
                </Text>
              )}
            </div>
          </Stack>
        </Stack>
      </SettingsContentCard>

      <Modal opened={editOpened} onClose={closeEdit} title="Edit profile">
        <form onSubmit={handleSubmitEdit}>
          <Stack gap={SETTINGS_CARD_STACK_GAP}>
            <TextInput
              label="Display name"
              value={name}
              onChange={(e) => setName(e.currentTarget.value)}
              required
              minLength={1}
            />
            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={closeEdit}>
                Cancel
              </Button>
              <Button type="submit" loading={patchMe.isPending}>
                Save
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <Modal opened={deactivateOpened} onClose={closeDeactivate} title="Deactivate account">
        <Stack gap={SETTINGS_CARD_STACK_GAP}>
          {user.isAdmin ? (
            <Text size="sm" c="dimmed">
              Administrators cannot deactivate their own account. Please ask another administrator.
            </Text>
          ) : (
            <Text size="sm" c="dimmed">
              Deactivate account? You will not be able to log in until an administrator reactivates
              you.
            </Text>
          )}
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={closeDeactivate}>
              Cancel
            </Button>
            <Button
              color="red"
              loading={deactivateMe.isPending}
              disabled={user.isAdmin}
              onClick={() => !user.isAdmin && deactivateMe.mutate()}
            >
              Deactivate
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
