import {
  Alert,
  Anchor,
  Badge,
  Box,
  Group,
  Loader,
  Pagination,
  Select,
  Stack,
  Table,
  Text,
} from '@mantine/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../api/client';
import { formatLocalDateTime } from '../../lib/localDateTime.js';
import { useMe } from '../../hooks/useMe';
import { NotificationDetailModal } from './NotificationDetailModal.js';
import { meNotificationsListQueryKey } from './meNotificationQueryParams.js';
import { eventTypeToCategory, NotificationCategoryIcon } from './notificationCategoryUi.js';
import {
  DEFAULT_LIMIT,
  PAGE_SIZE_OPTIONS,
  type MeNotificationCategory,
  type NotificationItem,
  type NotificationsResponse,
} from './meNotificationTypes.js';
import {
  documentDisplayTitle,
  eventHeadline,
  notificationDocumentHref,
  secondaryDetail,
} from './notificationsInboxFormatters.js';

export type { MeNotificationCategory, NotificationItem } from './meNotificationTypes.js';
export {
  ME_NOTIFICATION_CATEGORIES,
  PAGE_SIZE_OPTIONS,
  DEFAULT_LIMIT,
} from './meNotificationTypes.js';
export {
  parseMeNotificationCategory,
  parseMeNotificationUnreadOnly,
  meNotificationsListQueryKey,
} from './meNotificationQueryParams.js';

type NotificationsInboxPanelProps = {
  /** Inbox filter; must match GET /me/notifications `category`. */
  category: MeNotificationCategory;
  /** Unread-only list filter (e.g. synced with URL on `/notifications`). */
  unreadOnly: boolean;
  /** Whether Mark all can run (current list has items and is loaded). */
  onCanMarkAllChange?: (canMarkAll: boolean) => void;
};

export function NotificationsInboxPanel({
  category,
  unreadOnly,
  onCanMarkAllChange,
}: NotificationsInboxPanelProps) {
  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const [limit, setLimit] = useState<number>(DEFAULT_LIMIT);
  const [page, setPage] = useState(1);
  const [detailItem, setDetailItem] = useState<NotificationItem | null>(null);
  const offset = (page - 1) * limit;

  useEffect(() => {
    setPage(1);
  }, [category, unreadOnly]);

  const notificationsUrl = useMemo(() => {
    const sp = new URLSearchParams();
    sp.set('limit', String(limit));
    sp.set('offset', String(offset));
    sp.set('unreadOnly', unreadOnly ? 'true' : 'false');
    if (category !== 'all') sp.set('category', category);
    return `/api/v1/me/notifications?${sp.toString()}`;
  }, [limit, offset, unreadOnly, category]);

  const notificationsQuery = useQuery({
    queryKey: meNotificationsListQueryKey(limit, offset, unreadOnly, category),
    queryFn: async (): Promise<NotificationsResponse> => {
      const res = await apiFetch(notificationsUrl);
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? 'Failed to load notifications');
      }
      const data = (await res.json()) as NotificationsResponse;
      return {
        ...data,
        items: data.items.map((item) => ({
          ...item,
          payload:
            typeof item.payload === 'object' &&
            item.payload !== null &&
            !Array.isArray(item.payload)
              ? item.payload
              : {},
        })),
      };
    },
    enabled: !!me,
  });

  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const res = await apiFetch(`/api/v1/me/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? 'Failed to mark notification as read');
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['me', 'notifications'] });
    },
    onError: (error: Error) => {
      notifications.show({ title: 'Update failed', message: error.message, color: 'red' });
    },
  });

  const notificationItems = notificationsQuery.data?.items ?? [];
  const totalNotifications = notificationsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalNotifications / limit));

  useEffect(() => {
    onCanMarkAllChange?.(
      !notificationsQuery.isPending && !notificationsQuery.isError && totalNotifications > 0
    );
  }, [
    onCanMarkAllChange,
    notificationsQuery.isPending,
    notificationsQuery.isError,
    totalNotifications,
  ]);

  return (
    <Stack gap="md">
      <Group gap="md" wrap="wrap" align="flex-end" w="100%" justify="flex-end">
        <Text size="sm" c="dimmed">
          {notificationsQuery.data != null
            ? `${totalNotifications} notification${totalNotifications !== 1 ? 's' : ''}`
            : '–'}
        </Text>
        <Select
          label="Per page"
          data={PAGE_SIZE_OPTIONS.map((n) => ({ value: String(n), label: String(n) }))}
          value={String(limit)}
          onChange={(v) => {
            if (!v) return;
            setLimit(parseInt(v, 10));
            setPage(1);
          }}
          style={{ width: 90 }}
        />
      </Group>

      {notificationsQuery.isPending && <Loader size="sm" />}
      {notificationsQuery.isError && (
        <Alert color="red">
          {notificationsQuery.error instanceof Error
            ? notificationsQuery.error.message
            : 'Failed to load notifications'}
        </Alert>
      )}
      {!notificationsQuery.isPending && !notificationsQuery.isError && (
        <>
          <Box style={{ overflowX: 'auto' }}>
            <Table withTableBorder className="dense-list-table" style={{ minWidth: 640 }}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ width: '28%' }}>Event</Table.Th>
                  <Table.Th>Document</Table.Th>
                  <Table.Th style={{ width: '18%', whiteSpace: 'nowrap' }}>When</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {notificationItems.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={3}>
                      <Text size="sm" c="dimmed">
                        No notifications
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  notificationItems.map((item) => {
                    const docHref = notificationDocumentHref(item.eventType, item.payload);
                    const detail = secondaryDetail(item.eventType, item.payload);
                    const unread = item.readAt == null;
                    const itemCategory = eventTypeToCategory(item.eventType);
                    return (
                      <Table.Tr
                        key={item.id}
                        data-clickable-table-row
                        onClick={() => setDetailItem(item)}
                        style={{
                          borderLeft: unread
                            ? '3px solid var(--mantine-color-blue-filled)'
                            : '3px solid transparent',
                        }}
                      >
                        <Table.Td>
                          <Group gap="xs" wrap="nowrap" align="center">
                            <Box c="dimmed" style={{ display: 'flex', alignItems: 'center' }}>
                              <NotificationCategoryIcon category={itemCategory} size={16} />
                            </Box>
                            <Group gap="xs" wrap="nowrap" align="center">
                              <Text size="sm" c="dimmed" fw={600} lineClamp={2}>
                                {eventHeadline(item.eventType)}
                              </Text>
                              {!unread && (
                                <Badge size="xs" variant="dot" color="gray">
                                  Read
                                </Badge>
                              )}
                            </Group>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Stack gap={4}>
                            {docHref != null ? (
                              <Anchor
                                component={Link}
                                to={docHref}
                                c="inherit"
                                underline="hover"
                                fw={600}
                                size="sm"
                                lineClamp={2}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {documentDisplayTitle(item)}
                              </Anchor>
                            ) : (
                              <Text fw={600} size="sm" lineClamp={2}>
                                {documentDisplayTitle(item)}
                              </Text>
                            )}
                            {detail != null && (
                              <Text size="sm" c="dimmed" lineClamp={2}>
                                {detail}
                              </Text>
                            )}
                          </Stack>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" c="dimmed">
                            {formatLocalDateTime(item.createdAt)}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })
                )}
              </Table.Tbody>
            </Table>
          </Box>
          {totalPages > 1 && (
            <Group justify="flex-end">
              <Pagination value={page} onChange={setPage} total={totalPages} size="sm" />
            </Group>
          )}
        </>
      )}

      <NotificationDetailModal
        item={detailItem}
        opened={detailItem != null}
        onClose={() => setDetailItem(null)}
        onMarkRead={(id) => markAsRead.mutate(id)}
        markReadPending={markAsRead.isPending}
      />
    </Stack>
  );
}
