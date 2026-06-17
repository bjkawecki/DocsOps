import { useState } from 'react';
import {
  ActionIcon,
  Button,
  Group,
  Loader,
  Menu,
  Modal,
  Stack,
  Table,
  Text,
  TextInput,
} from '@mantine/core';
import { IconDotsVertical } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../api/client.js';
import {
  broadcastTargetLabel,
  datetimeLocalToIso,
  formatLocalDateTime,
  isoToDatetimeLocal,
  isDatetimeLocalInFuture,
  minDatetimeLocalNow,
  sendAtFieldLabel,
  type ScheduledBroadcastItem,
} from './AdminBroadcastTab/adminBroadcastTypes.js';

export function AdminScheduledBroadcastsSection() {
  const queryClient = useQueryClient();
  const [rescheduleItem, setRescheduleItem] = useState<ScheduledBroadcastItem | null>(null);
  const [sendAtLocal, setSendAtLocal] = useState('');

  const schedulesQuery = useQuery({
    queryKey: ['admin', 'notifications', 'broadcasts', 'schedules'] as const,
    queryFn: async () => {
      const res = await apiFetch('/api/v1/admin/notifications/broadcasts/schedules');
      if (!res.ok) throw new Error('Failed to load scheduled messages');
      return res.json() as Promise<{ items: ScheduledBroadcastItem[] }>;
    },
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({
      queryKey: ['admin', 'notifications', 'broadcasts', 'schedules'],
    });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'notifications', 'broadcasts'] });
  };

  const cancelMutation = useMutation({
    mutationFn: async (broadcastId: string) => {
      const res = await apiFetch(`/api/v1/admin/notifications/broadcasts/${broadcastId}/schedule`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? 'Failed to cancel message');
      }
    },
    onSuccess: () => {
      invalidate();
      notifications.show({ title: 'Scheduled message cancelled', message: '', color: 'green' });
    },
    onError: (error: Error) => {
      notifications.show({ title: 'Cancel failed', message: error.message, color: 'red' });
    },
  });

  const rescheduleMutation = useMutation({
    mutationFn: async ({ broadcastId, sendAt }: { broadcastId: string; sendAt: string }) => {
      const res = await apiFetch(`/api/v1/admin/notifications/broadcasts/${broadcastId}/schedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sendAt }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? 'Failed to reschedule message');
      }
      return res.json() as Promise<{ scheduledAt: string }>;
    },
    onSuccess: () => {
      setRescheduleItem(null);
      invalidate();
      notifications.show({ title: 'Schedule updated', message: '', color: 'green' });
    },
    onError: (error: Error) => {
      notifications.show({ title: 'Reschedule failed', message: error.message, color: 'red' });
    },
  });

  const sendNowMutation = useMutation({
    mutationFn: async (broadcastId: string) => {
      const res = await apiFetch(`/api/v1/admin/notifications/broadcasts/${broadcastId}/send-now`, {
        method: 'POST',
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? 'Failed to send message');
      }
      return res.json() as Promise<{ deliveredCount: number }>;
    },
    onSuccess: (result) => {
      invalidate();
      notifications.show({
        title: 'Message sent',
        message: `Delivered to ${result.deliveredCount} user(s).`,
        color: 'green',
      });
    },
    onError: (error: Error) => {
      notifications.show({ title: 'Send failed', message: error.message, color: 'red' });
    },
  });

  const items = schedulesQuery.data?.items ?? [];
  const pending =
    cancelMutation.isPending || rescheduleMutation.isPending || sendNowMutation.isPending;

  const openReschedule = (item: ScheduledBroadcastItem) => {
    setRescheduleItem(item);
    setSendAtLocal(isoToDatetimeLocal(item.scheduledAt));
  };

  const handleRescheduleSave = () => {
    if (!rescheduleItem) return;
    const sendAt = datetimeLocalToIso(sendAtLocal);
    if (sendAt == null || !isDatetimeLocalInFuture(sendAtLocal)) {
      notifications.show({
        title: 'Invalid time',
        message: 'Choose a date and time in the future.',
        color: 'yellow',
      });
      return;
    }
    rescheduleMutation.mutate({ broadcastId: rescheduleItem.id, sendAt });
  };

  return (
    <Stack gap="sm" mt="xl">
      <Group justify="space-between">
        <Text fw={600}>Scheduled system messages</Text>
        <Text size="sm" c="dimmed" component={Link} to="/admin/broadcast">
          Create message
        </Text>
      </Group>
      {schedulesQuery.isPending ? (
        <Loader size="sm" />
      ) : (
        <Table withTableBorder withColumnBorders className="admin-table-hover">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Send at</Table.Th>
              <Table.Th>Title</Table.Th>
              <Table.Th>Audience</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {items.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={4}>
                  <Text size="sm" c="dimmed">
                    No scheduled messages. Use{' '}
                    <Text span component={Link} to="/admin/broadcast">
                      Create message
                    </Text>{' '}
                    and choose &quot;Schedule for later&quot;.
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              items.map((item) => (
                <Table.Tr key={item.id}>
                  <Table.Td>
                    <Text size="sm">{formatLocalDateTime(item.scheduledAt)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" fw={500}>
                      {item.title}
                    </Text>
                    <Text size="xs" c="dimmed" lineClamp={2}>
                      {item.message}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{broadcastTargetLabel(item.targetKind)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Group justify="flex-end">
                      <Menu position="bottom-end" withinPortal>
                        <Menu.Target>
                          <ActionIcon variant="subtle" aria-label="Scheduled message actions">
                            <IconDotsVertical size={16} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item
                            disabled={pending}
                            onClick={() => sendNowMutation.mutate(item.id)}
                          >
                            Send now
                          </Menu.Item>
                          <Menu.Item disabled={pending} onClick={() => openReschedule(item)}>
                            Reschedule
                          </Menu.Item>
                          <Menu.Item
                            color="red"
                            disabled={pending}
                            onClick={() => cancelMutation.mutate(item.id)}
                          >
                            Cancel
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      )}

      <Modal
        opened={rescheduleItem != null}
        onClose={() => setRescheduleItem(null)}
        title="Reschedule message"
        centered
      >
        {rescheduleItem ? (
          <Stack gap="md">
            <Text size="sm" fw={500}>
              {rescheduleItem.title}
            </Text>
            <TextInput
              label={sendAtFieldLabel()}
              description="Date and time use your browser's local timezone."
              type="datetime-local"
              value={sendAtLocal}
              min={minDatetimeLocalNow()}
              onChange={(e) => setSendAtLocal(e.currentTarget.value)}
            />
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setRescheduleItem(null)}>
                Cancel
              </Button>
              <Button loading={rescheduleMutation.isPending} onClick={handleRescheduleSave}>
                Save
              </Button>
            </Group>
          </Stack>
        ) : null}
      </Modal>
    </Stack>
  );
}
