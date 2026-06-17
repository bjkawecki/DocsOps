import { useEffect, useState } from 'react';
import { Alert, Group, Loader, Pagination, Stack } from '@mantine/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { apiFetch } from '../../../api/client.js';
import { AdminBroadcastCreateModal } from './AdminBroadcastCreateModal.js';
import { AdminBroadcastTableSection } from './AdminBroadcastTableSection.js';
import { AdminBroadcastToolbar } from './AdminBroadcastToolbar.js';
import { BROADCAST_PAGE_SIZE_KEY, DEFAULT_PAGE_SIZE } from './adminBroadcastConstants.js';
import {
  datetimeLocalToIso,
  defaultFutureDatetimeLocal,
  type BroadcastDraft,
  type BroadcastHistoryItem,
} from './adminBroadcastTypes.js';

function readInitialLimit(): number {
  try {
    const stored = window.localStorage.getItem(BROADCAST_PAGE_SIZE_KEY);
    if (stored) {
      const parsed = Number(stored);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_PAGE_SIZE;
}

const emptyDraft = (): BroadcastDraft => ({
  title: '',
  message: '',
  targetKind: 'all',
  userIds: [],
  deliveryMode: 'now',
  sendAtLocal: defaultFutureDatetimeLocal(),
});

export function AdminBroadcastTab() {
  const queryClient = useQueryClient();
  const [limit, setLimit] = useState(readInitialLimit);
  const [offset, setOffset] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState<BroadcastDraft>(emptyDraft);

  const historyQuery = useQuery({
    queryKey: ['admin', 'notifications', 'broadcasts', 'sent', limit, offset] as const,
    queryFn: async () => {
      const res = await apiFetch(
        `/api/v1/admin/notifications/broadcasts?status=sent&limit=${limit}&offset=${offset}`
      );
      if (!res.ok) throw new Error('Failed to load broadcast history');
      return res.json() as Promise<{ items: BroadcastHistoryItem[]; total: number }>;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: BroadcastDraft) => {
      const sendAt =
        payload.deliveryMode === 'scheduled' ? datetimeLocalToIso(payload.sendAtLocal) : undefined;
      const res = await apiFetch('/api/v1/admin/notifications/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: payload.title.trim(),
          message: payload.message.trim(),
          targetKind: payload.targetKind,
          userIds: payload.targetKind === 'users' ? payload.userIds : undefined,
          sendAt,
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? 'Failed to create message');
      }
      return res.json() as Promise<{
        status: 'scheduled' | 'sent';
        deliveredCount: number;
        scheduledAt: string | null;
      }>;
    },
    onSuccess: (result) => {
      setCreateOpen(false);
      setDraft(emptyDraft());
      void queryClient.invalidateQueries({ queryKey: ['admin', 'notifications', 'broadcasts'] });
      if (result.status === 'scheduled') {
        notifications.show({
          title: 'Message scheduled',
          message: 'Manage it in the Scheduler tab.',
          color: 'green',
        });
      } else {
        notifications.show({
          title: 'Message sent',
          message: `Delivered to ${result.deliveredCount} user(s).`,
          color: 'green',
        });
      }
    },
    onError: (error: Error) => {
      notifications.show({ title: 'Create failed', message: error.message, color: 'red' });
    },
  });

  const total = historyQuery.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.floor(offset / limit) + 1;

  useEffect(() => {
    if (currentPage > pageCount) setOffset(0);
  }, [currentPage, pageCount]);

  return (
    <Stack gap="md">
      <AdminBroadcastToolbar
        total={total}
        limit={limit}
        onLimitChange={(next) => {
          setLimit(next);
          setOffset(0);
        }}
        onOpenCreate={() => {
          setDraft(emptyDraft());
          setCreateOpen(true);
        }}
      />

      {historyQuery.isError ? (
        <Alert color="red">
          {historyQuery.error instanceof Error ? historyQuery.error.message : 'Error'}
        </Alert>
      ) : null}

      {historyQuery.isPending ? <Loader size="sm" /> : null}

      <AdminBroadcastTableSection items={historyQuery.data?.items ?? []} loading={false} />

      {total > limit ? (
        <Group justify="center">
          <Pagination
            value={currentPage}
            onChange={(page) => setOffset((page - 1) * limit)}
            total={pageCount}
          />
        </Group>
      ) : null}

      <AdminBroadcastCreateModal
        opened={createOpen}
        onClose={() => setCreateOpen(false)}
        draft={draft}
        onDraftChange={setDraft}
        onCreate={() => createMutation.mutate(draft)}
        creating={createMutation.isPending}
      />
    </Stack>
  );
}
