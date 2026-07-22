import { useState } from 'react';
import {
  Box,
  Menu,
  Text,
  Stack,
  Badge,
  ScrollArea,
  Loader,
  ActionIcon,
  Group,
} from '@mantine/core';
import { IconBug } from '@tabler/icons-react';
import type { UseMutationResult } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { AdminUser } from './appShellNavUtils.js';
import { AppShellDebugResetModal } from './AppShellDebugResetModal.js';
import { AppShellDebugReseedModal } from './AppShellDebugReseedModal.js';
import {
  isPulseMockEnabledInSession,
  writePulseMockStorage,
} from '../../pages/HomePage/pulseMockData.js';

type Props = {
  show: boolean;
  adminUsersLoading: boolean;
  adminUsersError: boolean;
  adminUsers: AdminUser[] | undefined;
  impersonateMutation: UseMutationResult<void, Error, string, unknown>;
  resetPlatformMutation: UseMutationResult<{ deletedNonAdminUsers: number }, Error, void, unknown>;
  reseedPlatformMutation: UseMutationResult<{ seeded: true }, Error, void, unknown>;
};

export function AppShellDebugMenu({
  show,
  adminUsersLoading,
  adminUsersError,
  adminUsers,
  impersonateMutation,
  resetPlatformMutation,
  reseedPlatformMutation,
}: Props) {
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [reseedModalOpen, setReseedModalOpen] = useState(false);
  const [pulseMockOn, setPulseMockOn] = useState(() => isPulseMockEnabledInSession());
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  if (!show) return null;

  const togglePulseMock = () => {
    const next = !pulseMockOn;
    setPulseMockOn(next);
    writePulseMockStorage(next);
    const params = new URLSearchParams(searchParams);
    if (next) params.set('pulseMock', '1');
    else params.delete('pulseMock');
    const qs = params.toString();
    void navigate({ pathname: '/', search: qs ? `?${qs}` : '' });
  };

  return (
    <>
      <Box
        style={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1000,
        }}
      >
        <Menu position="bottom-end" shadow="md" width={320}>
          <Menu.Target>
            <ActionIcon variant="filled" size="md" aria-label="Debug menu" color="grape">
              <IconBug size={18} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Label>View as user</Menu.Label>
            {adminUsersLoading ? (
              <Menu.Item disabled>
                <Loader size="xs" />
              </Menu.Item>
            ) : adminUsersError ? (
              <Menu.Item disabled>
                <Text size="sm" c="dimmed">
                  Failed to load user list.
                </Text>
              </Menu.Item>
            ) : (adminUsers ?? []).length === 0 ? (
              <Menu.Item disabled>
                <Text size="sm" c="dimmed">
                  No users available.
                </Text>
              </Menu.Item>
            ) : (
              <ScrollArea.Autosize mah={320}>
                {(adminUsers ?? []).map((u) => (
                  <Menu.Item
                    key={u.id}
                    onClick={() => impersonateMutation.mutate(u.id)}
                    disabled={impersonateMutation.isPending}
                  >
                    <Stack gap={2}>
                      <Text size="sm" fw={500}>
                        {u.name}
                      </Text>
                      {u.email && (
                        <Text size="xs" c="dimmed">
                          {u.email}
                        </Text>
                      )}
                      <Badge size="xs" variant="filled">
                        {u.role}
                      </Badge>
                    </Stack>
                  </Menu.Item>
                ))}
              </ScrollArea.Autosize>
            )}

            <Menu.Divider />
            <Menu.Label>Development</Menu.Label>
            <Menu.Item closeMenuOnClick={false} onClick={togglePulseMock}>
              <Group justify="space-between" wrap="nowrap" gap="sm">
                <Text size="sm">Pulse mock feed</Text>
                <Badge size="xs" variant={pulseMockOn ? 'filled' : 'light'} color="grape">
                  {pulseMockOn ? 'On' : 'Off'}
                </Badge>
              </Group>
            </Menu.Item>
            <Menu.Item
              color="red"
              onClick={() => setResetModalOpen(true)}
              disabled={resetPlatformMutation.isPending || reseedPlatformMutation.isPending}
            >
              Reset platform data
            </Menu.Item>
            <Menu.Item
              onClick={() => setReseedModalOpen(true)}
              disabled={resetPlatformMutation.isPending || reseedPlatformMutation.isPending}
            >
              Re-seed from CSV
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Box>

      <AppShellDebugResetModal
        opened={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        loading={resetPlatformMutation.isPending}
        onConfirm={() => {
          resetPlatformMutation.mutate(undefined, {
            onSuccess: () => setResetModalOpen(false),
          });
        }}
      />

      <AppShellDebugReseedModal
        opened={reseedModalOpen}
        onClose={() => setReseedModalOpen(false)}
        loading={reseedPlatformMutation.isPending}
        onConfirm={() => {
          reseedPlatformMutation.mutate(undefined, {
            onSuccess: () => setReseedModalOpen(false),
          });
        }}
      />
    </>
  );
}
