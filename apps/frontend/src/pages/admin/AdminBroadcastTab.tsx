import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  Group,
  Loader,
  MultiSelect,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { apiFetch } from '../../api/client.js';

type BroadcastTargetKind =
  | 'all'
  | 'admins'
  | 'company_leads'
  | 'department_leads'
  | 'team_leads'
  | 'users';

type BroadcastHistoryItem = {
  id: string;
  title: string;
  message: string;
  targetKind: string;
  deliveredCount: number;
  createdAt: string;
};

const TARGET_OPTIONS: { value: BroadcastTargetKind; label: string }[] = [
  { value: 'all', label: 'All active users' },
  { value: 'admins', label: 'Administrators' },
  { value: 'company_leads', label: 'Company leads' },
  { value: 'department_leads', label: 'Department leads' },
  { value: 'team_leads', label: 'Team leads' },
  { value: 'users', label: 'Selected users' },
];

export function AdminBroadcastTab() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetKind, setTargetKind] = useState<BroadcastTargetKind>('all');
  const [userIds, setUserIds] = useState<string[]>([]);

  const usersQuery = useQuery({
    queryKey: ['admin', 'users', 'broadcast-picker'] as const,
    queryFn: async () => {
      const res = await apiFetch('/api/v1/admin/users?limit=200&offset=0&includeDeactivated=false');
      if (!res.ok) throw new Error('Failed to load users');
      const body = (await res.json()) as {
        items: Array<{ id: string; name: string; email: string | null }>;
      };
      return body.items;
    },
    enabled: targetKind === 'users',
  });

  const historyQuery = useQuery({
    queryKey: ['admin', 'notifications', 'broadcasts'] as const,
    queryFn: async () => {
      const res = await apiFetch('/api/v1/admin/notifications/broadcasts?limit=10&offset=0');
      if (!res.ok) throw new Error('Failed to load broadcast history');
      return res.json() as Promise<{ items: BroadcastHistoryItem[]; total: number }>;
    },
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch('/api/v1/admin/notifications/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          targetKind,
          userIds: targetKind === 'users' ? userIds : undefined,
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? 'Failed to send broadcast');
      }
      return res.json() as Promise<{ deliveredCount: number }>;
    },
    onSuccess: (result) => {
      setTitle('');
      setMessage('');
      setUserIds([]);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'notifications', 'broadcasts'] });
      notifications.show({
        title: 'Broadcast sent',
        message: `Delivered to ${result.deliveredCount} user(s).`,
        color: 'green',
      });
    },
    onError: (error: Error) => {
      notifications.show({ title: 'Broadcast failed', message: error.message, color: 'red' });
    },
  });

  const userOptions =
    usersQuery.data?.map((u) => ({
      value: u.id,
      label: u.email != null ? `${u.name} (${u.email})` : u.name,
    })) ?? [];

  return (
    <Stack gap="md">
      <Card withBorder padding="md">
        <Stack gap="md">
          <Text fw={600}>Send system message</Text>
          <Text size="sm" c="dimmed">
            In-app notification to selected users. Messages appear under Notifications → System.
          </Text>
          <TextInput
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.currentTarget.value)}
            maxLength={200}
            required
          />
          <Textarea
            label="Message"
            value={message}
            onChange={(e) => setMessage(e.currentTarget.value)}
            minRows={4}
            maxLength={4000}
            required
          />
          <Select
            label="Audience"
            data={TARGET_OPTIONS}
            value={targetKind}
            onChange={(v) => setTargetKind((v as BroadcastTargetKind | null) ?? 'all')}
          />
          {targetKind === 'users' ? (
            usersQuery.isPending ? (
              <Loader size="sm" />
            ) : (
              <MultiSelect
                label="Users"
                data={userOptions}
                value={userIds}
                onChange={setUserIds}
                searchable
                nothingFoundMessage="No users"
              />
            )
          ) : null}
          <Group justify="flex-end">
            <Button
              onClick={() => sendMutation.mutate()}
              loading={sendMutation.isPending}
              disabled={
                title.trim() === '' ||
                message.trim() === '' ||
                (targetKind === 'users' && userIds.length === 0)
              }
            >
              Send broadcast
            </Button>
          </Group>
        </Stack>
      </Card>

      <Card withBorder padding="md">
        <Text fw={600} mb="sm">
          Recent broadcasts
        </Text>
        {historyQuery.isPending && <Loader size="sm" />}
        {historyQuery.isError && (
          <Alert color="red">
            {historyQuery.error instanceof Error ? historyQuery.error.message : 'Error'}
          </Alert>
        )}
        {historyQuery.data?.items.length === 0 && !historyQuery.isPending ? (
          <Text size="sm" c="dimmed">
            No broadcasts yet.
          </Text>
        ) : null}
        <Stack gap="xs">
          {historyQuery.data?.items.map((item) => (
            <Box
              key={item.id}
              p="xs"
              style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}
            >
              <Text size="sm" fw={600}>
                {item.title}
              </Text>
              <Text size="sm" c="dimmed" lineClamp={2}>
                {item.message}
              </Text>
              <Text size="xs" c="dimmed" mt={4}>
                {item.targetKind} · {item.deliveredCount} recipients ·{' '}
                {new Date(item.createdAt).toLocaleString()}
              </Text>
            </Box>
          ))}
        </Stack>
      </Card>
    </Stack>
  );
}
