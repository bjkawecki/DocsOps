import { ActionIcon, Group, Stack, Text, UnstyledButton } from '@mantine/core';
import {
  IconCheck,
  IconClipboardCheck,
  IconFilePlus,
  IconFileText,
  IconMessageCircle,
  IconPencil,
  IconRefresh,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import {
  isPulseActivityKind,
  useMarkPulseItemRead,
  type PulseItem,
  type PulseItemKind,
} from '../../hooks/useMePulse.js';

const ICON_SIZE = 16;

function KindIcon({ kind }: { kind: PulseItemKind }) {
  switch (kind) {
    case 'draft-open':
      return <IconPencil size={ICON_SIZE} aria-hidden />;
    case 'review-awaiting':
      return <IconClipboardCheck size={ICON_SIZE} aria-hidden />;
    case 'review-decided':
      return <IconCheck size={ICON_SIZE} aria-hidden />;
    case 'document-new':
      return <IconFilePlus size={ICON_SIZE} aria-hidden />;
    case 'document-updated':
      return <IconRefresh size={ICON_SIZE} aria-hidden />;
    case 'document-comments':
      return <IconMessageCircle size={ICON_SIZE} aria-hidden />;
    default:
      return <IconFileText size={ICON_SIZE} aria-hidden />;
  }
}

type ItemProps = {
  item: PulseItem;
};

function PulseFeedItem({ item }: ItemProps) {
  const navigate = useNavigate();
  const markRead = useMarkPulseItemRead();
  const canMarkRead = isPulseActivityKind(item.kind);

  const openItem = () => {
    if (canMarkRead) {
      markRead.mutate(item.id);
    }
    void navigate(item.href);
  };

  return (
    <Group gap="sm" wrap="nowrap" align="flex-start" py={6}>
      <UnstyledButton
        onClick={openItem}
        style={{
          display: 'flex',
          gap: 10,
          flex: 1,
          minWidth: 0,
          textAlign: 'left',
          alignItems: 'flex-start',
        }}
      >
        <Text c="dimmed" mt={2} style={{ flexShrink: 0 }}>
          <KindIcon kind={item.kind} />
        </Text>
        <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
          <Text size="sm" fw={500} lineClamp={1}>
            {item.title}
          </Text>
          <Text size="sm" c="dimmed" lineClamp={2}>
            {item.body}
          </Text>
        </Stack>
      </UnstyledButton>
      {canMarkRead ? (
        <ActionIcon
          variant="subtle"
          size="sm"
          aria-label="Mark as read"
          onClick={() => markRead.mutate(item.id)}
          loading={markRead.isPending}
        >
          <IconCheck size={14} />
        </ActionIcon>
      ) : null}
    </Group>
  );
}

type Props = {
  items: PulseItem[];
};

export function PulseFeed({ items }: Props) {
  return (
    <Stack gap={2} align="stretch">
      {items.map((item) => (
        <PulseFeedItem key={item.id} item={item} />
      ))}
    </Stack>
  );
}
