import { Badge, Box, Button, Group, ScrollArea, Stack, Table, Text } from '@mantine/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { apiFetch } from '../../api/client';
import { SettingsContentCard } from './SettingsContentCard.js';
import {
  SETTINGS_FIELD_LABEL_GAP,
  SETTINGS_CARD_STACK_GAP,
  settingsCardDomId,
} from './settingsLayout.js';
import { SettingsCardTitle } from './SettingsCardTitle.js';

type SessionItem = { id: string; createdAt: string; expiresAt: string; isCurrent: boolean };

/** Keep the sessions card compact; scroll when there are more. */
const SESSIONS_MAX_VISIBLE = 5;
const SESSIONS_ROW_PX = 40;
const SESSIONS_HEADER_PX = 32;
const SESSIONS_LIST_MAX_HEIGHT = SESSIONS_HEADER_PX + SESSIONS_MAX_VISIBLE * SESSIONS_ROW_PX;

const stickyHeaderTh = {
  position: 'sticky' as const,
  top: 0,
  zIndex: 1,
  background: 'var(--mantine-color-body)',
};

export function SettingsSecurityTab() {
  const queryClient = useQueryClient();

  const { data: sessionsData } = useQuery({
    queryKey: ['me', 'sessions'],
    queryFn: async (): Promise<{ sessions: SessionItem[] }> => {
      const res = await apiFetch('/api/v1/me/sessions');
      if (!res.ok) throw new Error('Failed to load sessions');
      return (await res.json()) as { sessions: SessionItem[] };
    },
  });

  const revokeSession = useMutation({
    mutationFn: async ({ sessionId }: { sessionId: string; isCurrent: boolean }) => {
      const res = await apiFetch(`/api/v1/me/sessions/${encodeURIComponent(sessionId)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? res.statusText);
      }
    },
    onSuccess: (_, { isCurrent }) => {
      void queryClient.invalidateQueries({ queryKey: ['me', 'sessions'] });
      if (isCurrent) {
        notifications.show({
          title: 'Session ended',
          message: 'You have been logged out.',
          color: 'green',
        });
        void apiFetch('/api/v1/auth/logout', { method: 'POST' }).then(() => {
          window.location.href = '/login';
        });
      } else {
        notifications.show({
          title: 'Session revoked',
          message: 'The session has been ended.',
          color: 'green',
        });
      }
    },
    onError: (err: Error) => {
      notifications.show({ title: 'Revoke failed', message: err.message, color: 'red' });
    },
  });

  const revokeAllOtherSessions = useMutation({
    mutationFn: async () => {
      const res = await apiFetch('/api/v1/me/sessions', { method: 'DELETE' });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? res.statusText);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['me', 'sessions'] });
      notifications.show({
        title: 'Sessions ended',
        message: 'All other sessions have been revoked.',
        color: 'green',
      });
    },
    onError: (err: Error) => {
      notifications.show({ title: 'Revoke failed', message: err.message, color: 'red' });
    },
  });

  const sessions = sessionsData?.sessions ?? [];
  const hasOtherSessions = sessions.some((s) => !s.isCurrent);
  const sessionsScrollable = sessions.length > SESSIONS_MAX_VISIBLE;

  const sessionsTable =
    sessions.length > 0 ? (
      <Box style={{ overflowX: 'auto' }}>
        <Table withTableBorder className="dense-list-table" style={{ minWidth: 480 }}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th style={sessionsScrollable ? stickyHeaderTh : undefined}>Created</Table.Th>
              <Table.Th style={sessionsScrollable ? stickyHeaderTh : undefined}>Expires</Table.Th>
              <Table.Th style={sessionsScrollable ? stickyHeaderTh : undefined} />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {sessions.map((s) => (
              <Table.Tr key={s.id}>
                <Table.Td>
                  <Text size="sm">{new Date(s.createdAt).toLocaleString()}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{new Date(s.expiresAt).toLocaleString()}</Text>
                </Table.Td>
                <Table.Td>
                  {s.isCurrent ? (
                    <Badge size="sm" variant="filled">
                      Current session
                    </Badge>
                  ) : (
                    <Button
                      variant="subtle"
                      size="xs"
                      color="red"
                      onClick={() => revokeSession.mutate({ sessionId: s.id, isCurrent: false })}
                      loading={revokeSession.isPending}
                    >
                      Revoke
                    </Button>
                  )}
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Box>
    ) : null;

  return (
    <SettingsContentCard id={settingsCardDomId('sessions')} data-settings-card="sessions">
      <Stack gap={SETTINGS_CARD_STACK_GAP}>
        <Group justify="space-between" align="flex-start" wrap="nowrap" gap="md">
          <Stack gap={SETTINGS_FIELD_LABEL_GAP} style={{ flex: 1, minWidth: 0 }}>
            <SettingsCardTitle jumpId="sessions" />
            <Text size="xs" c="dimmed">
              Active sessions. Revoke others to log them out.
            </Text>
          </Stack>
          {hasOtherSessions ? (
            <Button
              variant="default"
              size="xs"
              color="red"
              onClick={() => revokeAllOtherSessions.mutate()}
              loading={revokeAllOtherSessions.isPending}
            >
              Revoke all other sessions
            </Button>
          ) : null}
        </Group>

        {sessionsTable != null ? (
          sessionsScrollable ? (
            <ScrollArea.Autosize
              mah={SESSIONS_LIST_MAX_HEIGHT}
              type="scroll"
              offsetScrollbars
              style={{ width: '100%' }}
            >
              {sessionsTable}
            </ScrollArea.Autosize>
          ) : (
            sessionsTable
          )
        ) : (
          <Text size="sm" c="dimmed">
            No sessions.
          </Text>
        )}
      </Stack>
    </SettingsContentCard>
  );
}
