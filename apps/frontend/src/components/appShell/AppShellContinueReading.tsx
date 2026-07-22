import { Box, ScrollArea, Stack, Text, UnstyledButton } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { RecentItemIcon } from '../contexts/RecentItemsCard.js';
import { useMe } from '../../hooks/useMe.js';
import { getAggregatedRecentItems, type AggregatedRecentItem } from '../../hooks/useRecentItems.js';
import { contextUrl } from '../../pages/contextWorkspace/contextPaths.js';

export const CONTINUE_LIST_LIMIT = 40;
/** Rows visible without scrolling. */
const CONTINUE_VISIBLE_COUNT = 3;
/** Fixed row height (pad 4+4 + sm line ~20). */
const CONTINUE_ROW_HEIGHT_PX = 28;
/** Matches Stack gap={2} → theme.spacing[2] (0.5rem ≈ 8px). */
const CONTINUE_STACK_GAP_PX = 8;
const CONTINUE_VIEWPORT_HEIGHT_PX =
  CONTINUE_VISIBLE_COUNT * CONTINUE_ROW_HEIGHT_PX +
  (CONTINUE_VISIBLE_COUNT - 1) * CONTINUE_STACK_GAP_PX;

const ITEM_ICON_SIZE = 14;

const continueItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  height: CONTINUE_ROW_HEIGHT_PX,
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

type Props = {
  isMiniRail: boolean;
  onNavigate: () => void;
};

/**
 * Global Continue reading list in the expanded sidebar.
 * Exactly 3 rows visible; further items scroll with a always-on subtle scrollbar.
 */
export function AppShellContinueReading({ isMiniRail, onNavigate }: Props) {
  const { data: me } = useMe();
  const navigate = useNavigate();

  if (isMiniRail) return null;

  const items = getAggregatedRecentItems(me?.preferences?.recentItemsByScope, CONTINUE_LIST_LIMIT);
  const needsScroll = items.length > CONTINUE_VISIBLE_COUNT;

  const goTo = (item: AggregatedRecentItem) => {
    onNavigate();
    void navigate(recentHref(item));
  };

  const list = (
    <Stack gap={2} align="stretch">
      {items.map((item) => (
        <UnstyledButton
          key={`${item.type}-${item.id}`}
          onClick={() => goTo(item)}
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

  return (
    <Box mt={14} px={4}>
      <Text size="xs" fw={600} c="dimmed" mb={2}>
        Continue reading
      </Text>
      {items.length === 0 ? (
        <Text size="xs" c="dimmed" px={4}>
          No recent items
        </Text>
      ) : needsScroll ? (
        <ScrollArea
          h={CONTINUE_VIEWPORT_HEIGHT_PX}
          type="always"
          scrollbarSize={4}
          offsetScrollbars="y"
          className="app-shell-continue-scroll"
        >
          {list}
        </ScrollArea>
      ) : (
        list
      )}
    </Box>
  );
}
