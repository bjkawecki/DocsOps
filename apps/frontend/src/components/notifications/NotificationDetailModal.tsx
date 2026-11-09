import { Badge, Button, Group, Modal, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { formatLocalDateTime } from '../../lib/localDateTime.js';
import type { NotificationItem } from './meNotificationTypes.js';
import { NotificationActionButton } from './NotificationActionLink.js';
import { NotificationReadBadge } from './NotificationReadBadge.js';
import {
  documentDisplayTitle,
  eventHeadline,
  notificationActionTarget,
  notificationBodyText,
  notificationSourceLabel,
} from './notificationsInboxFormatters.js';

type NotificationDetailModalProps = {
  item: NotificationItem | null;
  opened: boolean;
  onClose: () => void;
  onMarkRead: (notificationId: string) => void;
  markReadPending: boolean;
};

export function NotificationDetailModal({
  item,
  opened,
  onClose,
  onMarkRead,
  markReadPending,
}: NotificationDetailModalProps) {
  const { t } = useTranslation('notifications');
  if (item == null) return null;

  const unread = item.readAt == null;
  const actionTarget = notificationActionTarget(item.eventType, item.payload);
  const body = notificationBodyText(t, item.eventType, item.payload);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={eventHeadline(t, item.eventType)}
      size="md"
      centered
    >
      <Stack gap="md">
        <Group gap="xs">
          <Badge variant="light">{notificationSourceLabel(t, item)}</Badge>
          {unread ? (
            <Badge color="blue" variant="filled">
              {t('detail.unread')}
            </Badge>
          ) : (
            <NotificationReadBadge />
          )}
        </Group>

        <Stack gap={4}>
          <Text size="sm" c="dimmed">
            {formatLocalDateTime(item.createdAt)}
          </Text>
          <Text fw={600} size="lg">
            {documentDisplayTitle(t, item)}
          </Text>
        </Stack>

        {body != null && body.trim() !== '' ? (
          <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
            {body}
          </Text>
        ) : null}

        <Group justify="space-between" mt="sm">
          {unread ? (
            <Button variant="light" loading={markReadPending} onClick={() => onMarkRead(item.id)}>
              {t('detail.markAsRead')}
            </Button>
          ) : (
            <span />
          )}
          {actionTarget != null ? (
            <NotificationActionButton
              target={actionTarget}
              routeLabel={t('detail.openSource')}
              downloadLabel={t('detail.downloadFile')}
              onNavigate={onClose}
            />
          ) : (
            <Button variant="default" onClick={onClose}>
              {t('detail.close')}
            </Button>
          )}
        </Group>
      </Stack>
    </Modal>
  );
}
