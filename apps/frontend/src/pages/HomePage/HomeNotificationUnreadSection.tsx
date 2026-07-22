import { Anchor, Box, Group, Loader, Stack, Text } from '@mantine/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../api/client.js';
import { meNotificationsListQueryKey } from '../../components/notifications/meNotificationQueryParams.js';
import type {
  MeNotificationCategory,
  NotificationsResponse,
} from '../../components/notifications/meNotificationTypes.js';
import {
  documentDisplayTitle,
  eventHeadline,
  notificationDocumentHref,
} from '../../components/notifications/notificationsInboxFormatters.js';
import { SectionLabel } from '../../components/ui/SectionLabel.js';
import { useMe } from '../../hooks/useMe.js';
import { HOME_SECTION_LIMIT } from './homePageConstants.js';

type HomeNotificationUnreadSectionProps = {
  title: string;
  category: Extract<MeNotificationCategory, 'documents' | 'comments'>;
  inboxHref: string;
  /** Shown when there are no unread items. */
  emptyMessage: string;
};

/**
 * Unread notification rows for Home Attention column.
 * Always rendered (loading / empty / error / list).
 */
export function HomeNotificationUnreadSection({
  title,
  category,
  inboxHref,
  emptyMessage,
}: HomeNotificationUnreadSectionProps) {
  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const limit = HOME_SECTION_LIMIT;

  const listUrl = `/api/v1/me/notifications?${new URLSearchParams({
    limit: String(limit),
    offset: '0',
    unreadOnly: 'true',
    category,
  }).toString()}`;

  const query = useQuery({
    queryKey: meNotificationsListQueryKey(limit, 0, true, category),
    queryFn: async (): Promise<NotificationsResponse> => {
      const res = await apiFetch(listUrl);
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

  const total = query.data?.total ?? 0;
  const items = query.data?.items ?? [];

  return (
    <Stack gap="xs" align="stretch">
      <Group justify="space-between" align="baseline" wrap="nowrap" gap="md">
        <SectionLabel mb={0}>
          {title}
          {!query.isPending && !query.isError && total > 0 ? ` · ${total}` : ''}
        </SectionLabel>
        <Anchor component={Link} to={inboxHref} size="xs">
          Notifications
        </Anchor>
      </Group>
      {query.isPending ? (
        <Loader size="sm" />
      ) : query.isError ? (
        <Text size="sm" c="red">
          Failed to load.
        </Text>
      ) : total === 0 ? (
        <Text size="sm" c="dimmed">
          {emptyMessage}
        </Text>
      ) : (
        <Stack gap={6} align="stretch">
          {items.map((item) => {
            const href = notificationDocumentHref(item.eventType, item.payload);
            const label = documentDisplayTitle(item);
            const headline = eventHeadline(item.eventType);
            const content = (
              <Box style={{ minWidth: 0, flex: 1 }}>
                <Text size="sm" fw={500} lineClamp={1}>
                  {label}
                </Text>
                <Text size="xs" c="dimmed" lineClamp={1}>
                  {headline}
                </Text>
              </Box>
            );
            if (href == null) {
              return (
                <Group
                  key={item.id}
                  gap="sm"
                  wrap="nowrap"
                  align="flex-start"
                  style={{ cursor: 'pointer' }}
                  onClick={() => markAsRead.mutate(item.id)}
                >
                  {content}
                </Group>
              );
            }
            return (
              <Anchor
                key={item.id}
                component={Link}
                to={href}
                underline="never"
                c="inherit"
                onClick={() => {
                  markAsRead.mutate(item.id);
                }}
                style={{ display: 'block' }}
              >
                <Group gap="sm" wrap="nowrap" align="flex-start">
                  {content}
                </Group>
              </Anchor>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}
