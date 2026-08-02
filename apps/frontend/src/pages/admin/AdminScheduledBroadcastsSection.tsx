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
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../api/client.js';
import {
  datetimeLocalToIso,
  formatLocalDateTime,
  isoToDatetimeLocal,
  isDatetimeLocalInFuture,
  minDatetimeLocalNow,
  sendAtFieldLabel,
  useBroadcastTargetLabel,
  type ScheduledBroadcastItem,
} from './AdminBroadcastTab/adminBroadcastTypes.js';

export function AdminScheduledBroadcastsSection() {
  const { t } = useTranslation('admin');
  const broadcastTargetLabel = useBroadcastTargetLabel();
  const queryClient = useQueryClient();
  const [rescheduleItem, setRescheduleItem] = useState<ScheduledBroadcastItem | null>(null);
  const [sendAtLocal, setSendAtLocal] = useState('');

  const schedulesQuery = useQuery({
    queryKey: ['admin', 'notifications', 'broadcasts', 'schedules'] as const,
    queryFn: async () => {
      const res = await apiFetch('/api/v1/admin/notifications/broadcasts/schedules');
      if (!res.ok) throw new Error(t('common:errors.loadFailed'));
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
        throw new Error(err.error ?? t('broadcast.scheduledSection.toasts.cancelFailedTitle'));
      }
    },
    onSuccess: () => {
      invalidate();
      notifications.show({
        title: t('broadcast.scheduledSection.toasts.cancelledTitle'),
        message: '',
        color: 'green',
      });
    },
    onError: (error: Error) => {
      notifications.show({
        title: t('broadcast.scheduledSection.toasts.cancelFailedTitle'),
        message: error.message,
        color: 'red',
      });
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
        throw new Error(err.error ?? t('broadcast.scheduledSection.toasts.rescheduleFailedTitle'));
      }
      return res.json() as Promise<{ scheduledAt: string }>;
    },
    onSuccess: () => {
      setRescheduleItem(null);
      invalidate();
      notifications.show({
        title: t('broadcast.scheduledSection.toasts.rescheduleUpdatedTitle'),
        message: '',
        color: 'green',
      });
    },
    onError: (error: Error) => {
      notifications.show({
        title: t('broadcast.scheduledSection.toasts.rescheduleFailedTitle'),
        message: error.message,
        color: 'red',
      });
    },
  });

  const sendNowMutation = useMutation({
    mutationFn: async (broadcastId: string) => {
      const res = await apiFetch(`/api/v1/admin/notifications/broadcasts/${broadcastId}/send-now`, {
        method: 'POST',
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? t('broadcast.scheduledSection.toasts.sendFailedTitle'));
      }
      return res.json() as Promise<{ deliveredCount: number }>;
    },
    onSuccess: (result) => {
      invalidate();
      notifications.show({
        title: t('broadcast.toasts.sentTitle'),
        message: t('broadcast.toasts.sentMessage', { count: result.deliveredCount }),
        color: 'green',
      });
    },
    onError: (error: Error) => {
      notifications.show({
        title: t('broadcast.scheduledSection.toasts.sendFailedTitle'),
        message: error.message,
        color: 'red',
      });
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
        title: t('broadcast.scheduledSection.toasts.invalidTimeTitle'),
        message: t('broadcast.scheduledSection.toasts.invalidTimeMessage'),
        color: 'yellow',
      });
      return;
    }
    rescheduleMutation.mutate({ broadcastId: rescheduleItem.id, sendAt });
  };

  return (
    <Stack gap="sm" mt="xl">
      <Group justify="space-between">
        <Text fw={600}>{t('broadcast.scheduledSection.title')}</Text>
        <Text size="sm" c="dimmed" component={Link} to="/admin/platform/broadcast">
          {t('broadcast.scheduledSection.createLink')}
        </Text>
      </Group>
      {schedulesQuery.isPending ? (
        <Loader size="sm" />
      ) : (
        <Table withTableBorder withColumnBorders className="admin-table-hover">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t('broadcast.scheduledSection.table.sendAt')}</Table.Th>
              <Table.Th>{t('broadcast.scheduledSection.table.title')}</Table.Th>
              <Table.Th>{t('broadcast.scheduledSection.table.audience')}</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {items.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={4}>
                  <Text size="sm" c="dimmed">
                    <Trans
                      i18nKey="broadcast.scheduledSection.empty"
                      t={t}
                      components={{
                        link: <Text span component={Link} to="/admin/platform/broadcast" />,
                      }}
                    />
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
                          <ActionIcon
                            variant="subtle"
                            aria-label={t('broadcast.scheduledSection.menuActionsAria')}
                          >
                            <IconDotsVertical size={16} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item
                            disabled={pending}
                            onClick={() => sendNowMutation.mutate(item.id)}
                          >
                            {t('broadcast.scheduledSection.menuSendNow')}
                          </Menu.Item>
                          <Menu.Item disabled={pending} onClick={() => openReschedule(item)}>
                            {t('broadcast.scheduledSection.menuReschedule')}
                          </Menu.Item>
                          <Menu.Item
                            color="red"
                            disabled={pending}
                            onClick={() => cancelMutation.mutate(item.id)}
                          >
                            {t('broadcast.scheduledSection.menuCancel')}
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
        title={t('broadcast.scheduledSection.rescheduleModalTitle')}
        centered
      >
        {rescheduleItem ? (
          <Stack gap="md">
            <Text size="sm" fw={500}>
              {rescheduleItem.title}
            </Text>
            <TextInput
              label={sendAtFieldLabel(t('broadcast.createModal.sendAtLabel'))}
              description={t('broadcast.createModal.sendAtDescription')}
              type="datetime-local"
              value={sendAtLocal}
              min={minDatetimeLocalNow()}
              onChange={(e) => setSendAtLocal(e.currentTarget.value)}
            />
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setRescheduleItem(null)}>
                {t('common:actions.cancel')}
              </Button>
              <Button loading={rescheduleMutation.isPending} onClick={handleRescheduleSave}>
                {t('common:actions.save')}
              </Button>
            </Group>
          </Stack>
        ) : null}
      </Modal>
    </Stack>
  );
}
