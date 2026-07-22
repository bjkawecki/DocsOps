import { Box, Button, Group, Modal, ScrollArea, Stack, Text, UnstyledButton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconClock } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { RecentItemIcon } from '../contexts/RecentItemsCard.js';
import { useMe } from '../../hooks/useMe.js';
import {
  formatRecentScopeLabel,
  getAggregatedRecentItems,
  type AggregatedRecentItem,
} from '../../hooks/useRecentItems.js';
import { contextUrl } from '../../pages/contextWorkspace/contextPaths.js';

export const CONTINUE_LIST_LIMIT = 40;
/** Rows shown in the sidebar (rest via See all). */
const CONTINUE_VISIBLE_COUNT = 3;
/** Fixed modal list viewport (cap height; scroll inside). */
const CONTINUE_MODAL_LIST_HEIGHT = 'min(420px, 60vh)';

const ITEM_ICON_SIZE = 14;
const DETAILED_ITEM_ICON_SIZE = 16;

const continueItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  height: 28,
  padding: '0 6px',
  borderRadius: 'var(--mantine-radius-sm)',
  width: '100%',
  textAlign: 'left' as const,
  boxSizing: 'border-box' as const,
};

function recentHref(item: AggregatedRecentItem): string {
  return item.type === 'document' ? `/documents/${item.id}` : contextUrl(item.id);
}

function itemLabel(item: AggregatedRecentItem): string {
  return item.name?.trim() ? item.name : item.id;
}

function itemMetaLine(item: AggregatedRecentItem, scopeLabel: string): string | null {
  const parts: string[] = [];
  const scope = scopeLabel.trim();
  if (scope) parts.push(`Scope: ${scope}`);
  if (item.type === 'document') {
    const ctx = item.contextName?.trim();
    if (ctx) parts.push(`Context: ${ctx}`);
  }
  return parts.length > 0 ? parts.join(' · ') : null;
}

type Props = {
  isMiniRail: boolean;
  onNavigate: () => void;
};

type CompactListProps = {
  items: AggregatedRecentItem[];
  onSelect: (item: AggregatedRecentItem) => void;
};

function ContinueCompactList({ items, onSelect }: CompactListProps) {
  return (
    <Stack gap={2} align="stretch">
      {items.map((item) => (
        <UnstyledButton
          key={`${item.type}-${item.id}`}
          onClick={() => onSelect(item)}
          className="app-shell-continue-item"
          style={continueItemStyle}
        >
          <RecentItemIcon type={item.type} size={ITEM_ICON_SIZE} />
          <Text
            size="sm"
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
              minWidth: 0,
            }}
          >
            {itemLabel(item)}
          </Text>
        </UnstyledButton>
      ))}
    </Stack>
  );
}

type DetailedListProps = {
  items: AggregatedRecentItem[];
  onSelect: (item: AggregatedRecentItem) => void;
  scopeLabelFor: (scopeKey: string) => string;
};

function ContinueDetailedList({ items, onSelect, scopeLabelFor }: DetailedListProps) {
  return (
    <Stack gap={10} align="stretch">
      {items.map((item) => {
        const meta = itemMetaLine(item, scopeLabelFor(item.scopeKey));
        return (
          <UnstyledButton
            key={`${item.type}-${item.id}`}
            onClick={() => onSelect(item)}
            className="app-shell-continue-item app-shell-continue-item--detailed"
          >
            <span className="app-shell-continue-item-icon">
              <RecentItemIcon type={item.type} size={DETAILED_ITEM_ICON_SIZE} />
            </span>
            <span className="app-shell-continue-item-text">
              <Text size="md" className="app-shell-continue-item-title" component="span">
                {itemLabel(item)}
              </Text>
              {meta ? (
                <Text
                  size="sm"
                  c="dimmed"
                  className="app-shell-continue-item-meta"
                  component="span"
                >
                  {meta}
                </Text>
              ) : null}
            </span>
          </UnstyledButton>
        );
      })}
    </Stack>
  );
}

/**
 * Global Continue reading list in the expanded sidebar.
 * Shows 3 rows; See all opens a fixed-height scrollable modal (up to 40).
 */
export function AppShellContinueReading({ isMiniRail, onNavigate }: Props) {
  const { data: me } = useMe();
  const navigate = useNavigate();
  const [allOpen, { open: openAll, close: closeAll }] = useDisclosure(false);

  if (isMiniRail) return null;

  const items = getAggregatedRecentItems(me?.preferences?.recentItemsByScope, CONTINUE_LIST_LIMIT);
  if (items.length === 0) return null;

  const preview = items.slice(0, CONTINUE_VISIBLE_COUNT);
  const showSeeAll = items.length > CONTINUE_VISIBLE_COUNT;

  const scopeLabelFor = (scopeKey: string) =>
    formatRecentScopeLabel(scopeKey, me?.identity ?? null);

  const goTo = (item: AggregatedRecentItem) => {
    closeAll();
    onNavigate();
    void navigate(recentHref(item));
  };

  return (
    <Box mt={14} px={4}>
      <Group justify="space-between" align="center" gap="xs" wrap="nowrap" mb={2}>
        <Text size="xs" fw={600} c="dimmed" style={{ flexShrink: 0 }}>
          Continue reading
        </Text>
        {showSeeAll ? (
          <UnstyledButton
            type="button"
            className="app-shell-continue-see-all"
            onClick={openAll}
            aria-label="See all continue reading"
          >
            See all
          </UnstyledButton>
        ) : null}
      </Group>
      <ContinueCompactList items={preview} onSelect={goTo} />
      <Modal
        opened={allOpen}
        onClose={closeAll}
        title={
          <Group gap="sm" wrap="nowrap">
            <IconClock size={20} stroke={1.75} aria-hidden />
            <Text size="lg" fw={600}>
              Continue reading
            </Text>
          </Group>
        }
        size="md"
        padding="md"
        classNames={{
          content: 'app-shell-continue-modal',
          header: 'app-shell-continue-modal-header',
          body: 'app-shell-continue-modal-body',
        }}
      >
        <ScrollArea
          h={CONTINUE_MODAL_LIST_HEIGHT}
          type="auto"
          scrollbarSize={6}
          offsetScrollbars="y"
          className="app-shell-continue-modal-scroll"
          px={4}
        >
          <ContinueDetailedList items={items} onSelect={goTo} scopeLabelFor={scopeLabelFor} />
        </ScrollArea>
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={closeAll}>
            Close
          </Button>
        </Group>
      </Modal>
    </Box>
  );
}
