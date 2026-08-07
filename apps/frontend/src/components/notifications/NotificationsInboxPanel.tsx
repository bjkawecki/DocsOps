import {
  Alert,
  Anchor,
  Box,
  Group,
  Loader,
  Pagination,
  Select,
  Stack,
  Table,
  Text,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../api/client.js';
import { WIDE_MIN_WIDTH } from '../appShell/appShellLayoutConstants.js';
import { formatLocalDateTime } from '../../lib/localDateTime.js';
import { useMe } from '../../hooks/useMe.js';
import { EntityListCard } from '../ui/EntityListCard.js';
import { NotificationDetailModal } from './NotificationDetailModal.js';
import { meNotificationsListQueryKey } from './meNotificationQueryParams.js';
import { eventTypeToCategory, NotificationCategoryIcon } from './notificationCategoryUi.js';
import { NotificationReadBadge } from './NotificationReadBadge.js';
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
  /** Total matching notifications for breadcrumb (null while loading / error). */
  onTotalChange?: (total: number | null) => void;
};

export function NotificationsInboxPanel({
  category,
  unreadOnly,
  onCanMarkAllChange,
  onTotalChange,
}: NotificationsInboxPanelProps) {
  const { t } = useTranslation('notifications');
  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const isWide = useMediaQuery(WIDE_MIN_WIDTH) ?? true;
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
        throw new Error(err.error ?? t('inbox.loadFailed'));
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
        throw new Error(err.error ?? t('toasts.markReadFailed'));
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['me', 'notifications'] });
    },
    onError: (error: Error) => {
      notifications.show({
        title: t('toasts.updateFailedTitle'),
        message: error.message,
        color: 'red',
      });
    },
  });

  const notificationItems = notificationsQuery.data?.items ?? [];
  const totalNotifications = notificationsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalNotifications / limit));
  const listReady = !notificationsQuery.isPending && !notificationsQuery.isError;

  useEffect(() => {
    onCanMarkAllChange?.(listReady && totalNotifications > 0);
  }, [onCanMarkAllChange, listReady, totalNotifications]);

  useEffect(() => {
    if (notificationsQuery.isPending) {
      onTotalChange?.(null);
      return;
    }
    if (notificationsQuery.isError) {
      onTotalChange?.(null);
      return;
    }
    onTotalChange?.(totalNotifications);
  }, [onTotalChange, notificationsQuery.isPending, notificationsQuery.isError, totalNotifications]);

  const pageSizeSelect = (
    <Select
      aria-label={t('inbox.perPage')}
      data={PAGE_SIZE_OPTIONS.map((n) => ({ value: String(n), label: String(n) }))}
      value={String(limit)}
      onChange={(v) => {
        if (!v) return;
        setLimit(parseInt(v, 10));
        setPage(1);
      }}
      allowDeselect={false}
      w={72}
      size="xs"
    />
  );

  return (
    <Stack gap="md">
      {notificationsQuery.isPending && <Loader size="sm" />}
      {notificationsQuery.isError && (
        <Alert color="red">
          {notificationsQuery.error instanceof Error
            ? notificationsQuery.error.message
            : t('inbox.loadFailed')}
        </Alert>
      )}
      {listReady && (
        <>
          {isWide ? (
            <Box style={{ overflowX: 'auto' }}>
              <Table withTableBorder className="dense-list-table" style={{ minWidth: 640 }}>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th style={{ width: '28%' }}>{t('inbox.table.event')}</Table.Th>
                    <Table.Th>{t('inbox.table.document')}</Table.Th>
                    <Table.Th style={{ width: '18%', whiteSpace: 'nowrap' }}>
                      {t('inbox.table.when')}
                    </Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {notificationItems.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={3}>
                        <Text size="sm" c="dimmed">
                          {t('inbox.empty')}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    notificationItems.map((item) => {
                      const docHref = notificationDocumentHref(item.eventType, item.payload);
                      const detail = secondaryDetail(t, item.eventType, item.payload);
                      const unread = item.readAt == null;
                      const itemCategory = eventTypeToCategory(item.eventType);
                      return (
                        <Table.Tr
                          key={item.id}
                          data-clickable-table-row
                          onClick={() => setDetailItem(item)}
                          style={{
                            boxShadow: unread
                              ? 'inset 3px 0 0 var(--mantine-color-blue-filled)'
                              : undefined,
                          }}
                        >
                          <Table.Td>
                            <Group gap="xs" wrap="nowrap" align="center">
                              <Box c="dimmed" style={{ display: 'flex', alignItems: 'center' }}>
                                <NotificationCategoryIcon category={itemCategory} size={16} />
                              </Box>
                              <Group gap="xs" wrap="nowrap" align="center">
                                <Text size="sm" c="dimmed" fw={600} lineClamp={2}>
                                  {eventHeadline(t, item.eventType)}
                                </Text>
                                {!unread && <NotificationReadBadge />}
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
                                  {documentDisplayTitle(t, item)}
                                </Anchor>
                              ) : (
                                <Text fw={600} size="sm" lineClamp={2}>
                                  {documentDisplayTitle(t, item)}
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
          ) : notificationItems.length === 0 ? (
            <Text size="sm" c="dimmed">
              {t('inbox.empty')}
            </Text>
          ) : (
            <Stack gap="sm">
              {notificationItems.map((item) => {
                const detail = secondaryDetail(t, item.eventType, item.payload);
                const unread = item.readAt == null;
                const itemCategory = eventTypeToCategory(item.eventType);
                return (
                  <EntityListCard
                    key={item.id}
                    onClick={() => setDetailItem(item)}
                    leftSection={<NotificationCategoryIcon category={itemCategory} size={16} />}
                    title={
                      <Group gap="xs" wrap="nowrap" align="center">
                        <Text fw={600} size="sm" lineClamp={2}>
                          {eventHeadline(t, item.eventType)}
                        </Text>
                        {!unread && <NotificationReadBadge />}
                      </Group>
                    }
                    meta={
                      <Stack gap={2}>
                        <Text size="xs" fw={600} lineClamp={2}>
                          {documentDisplayTitle(t, item)}
                        </Text>
                        {detail != null ? (
                          <Text size="xs" c="dimmed" lineClamp={2}>
                            {detail}
                          </Text>
                        ) : null}
                        <Text size="xs" c="dimmed">
                          {formatLocalDateTime(item.createdAt)}
                        </Text>
                      </Stack>
                    }
                    rightSection={
                      unread ? (
                        <Box
                          w={8}
                          h={8}
                          mt={4}
                          style={{
                            borderRadius: '50%',
                            background: 'var(--mantine-color-blue-filled)',
                          }}
                          aria-hidden
                        />
                      ) : null
                    }
                  />
                );
              })}
            </Stack>
          )}
          <Group justify="flex-end" align="center" gap="md" wrap="wrap">
            <Group gap="xs" wrap="nowrap" align="center">
              <Text size="xs" c="dimmed">
                {t('inbox.perPage')}
              </Text>
              {pageSizeSelect}
            </Group>
            {totalPages > 1 ? (
              <Pagination value={page} onChange={setPage} total={totalPages} size="sm" />
            ) : null}
          </Group>
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
