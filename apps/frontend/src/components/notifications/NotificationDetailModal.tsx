import { Badge, Button, Group, Modal, Stack, Text } from '@mantine/core';
import { Link } from 'react-router-dom';
import { formatLocalDateTime } from '../../lib/localDateTime.js';
import type { NotificationItem } from './meNotificationTypes.js';
import { NotificationReadBadge } from './NotificationReadBadge.js';
import {
  documentDisplayTitle,
  eventHeadline,
  notificationBodyText,
  notificationDocumentHref,
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
  if (item == null) return null;

  const unread = item.readAt == null;
  const sourceHref = notificationDocumentHref(item.eventType, item.payload);
  const body = notificationBodyText(item.eventType, item.payload);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={eventHeadline(item.eventType)}
      size="md"
      centered
    >
      <Stack gap="md">
        <Group gap="xs">
          <Badge variant="light">{notificationSourceLabel(item)}</Badge>
          {unread ? (
            <Badge color="blue" variant="filled">
              Unread
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
            {documentDisplayTitle(item)}
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
              Mark as read
            </Button>
          ) : (
            <span />
          )}
          {sourceHref != null ? (
            <Button component={Link} to={sourceHref} variant="filled" onClick={onClose}>
              Open source
            </Button>
          ) : (
            <Button variant="default" onClick={onClose}>
              Close
            </Button>
          )}
        </Group>
      </Stack>
    </Modal>
  );
}
