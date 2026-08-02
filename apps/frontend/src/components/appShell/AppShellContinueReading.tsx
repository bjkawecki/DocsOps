import { Box, Button, Group, Modal, ScrollArea, Stack, Text, UnstyledButton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconClock, IconFileText } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useMe } from '../../hooks/useMe.js';
import {
  formatRecentScopeLabel,
  getAggregatedRecentItems,
  type AggregatedRecentItem,
} from '../../hooks/useRecentItems.js';

export const CONTINUE_LIST_LIMIT = 40;
/** Rows shown in the sidebar (rest via See all). */
const CONTINUE_VISIBLE_COUNT = 3;
/** Fixed modal list viewport (cap height; scroll inside). */
const CONTINUE_MODAL_LIST_HEIGHT = 'min(420px, 60vh)';

const ITEM_ICON_SIZE = 20;
const DETAILED_ITEM_ICON_SIZE = 20;

function itemLabel(item: AggregatedRecentItem): string {
  return item.name?.trim() ? item.name : item.id;
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
        >
          <IconFileText size={ITEM_ICON_SIZE} stroke={1.5} aria-hidden />
          <Text size="md" fw={600} className="app-shell-continue-item-label">
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
  metaLineFor: (item: AggregatedRecentItem) => string | null;
};

function ContinueDetailedList({ items, onSelect, metaLineFor }: DetailedListProps) {
  return (
    <Stack gap={10} align="stretch">
      {items.map((item) => {
        const meta = metaLineFor(item);
        return (
          <UnstyledButton
            key={`${item.type}-${item.id}`}
            onClick={() => onSelect(item)}
            className="app-shell-continue-item app-shell-continue-item--detailed"
          >
            <span className="app-shell-continue-item-icon">
              <IconFileText size={DETAILED_ITEM_ICON_SIZE} stroke={1.5} aria-hidden />
            </span>
            <span className="app-shell-continue-item-text">
              <Text size="md" fw={600} className="app-shell-continue-item-title" component="span">
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
 * Global Continue reading list in the expanded sidebar (documents only).
 * Shows 3 rows; See all opens a fixed-height scrollable modal (up to 40).
 */
export function AppShellContinueReading({ isMiniRail, onNavigate }: Props) {
  const { t } = useTranslation(['shell', 'common']);
  const { data: me } = useMe();
  const navigate = useNavigate();
  const [allOpen, { open: openAll, close: closeAll }] = useDisclosure(false);

  if (isMiniRail) return null;

  const items = getAggregatedRecentItems(me?.preferences?.recentItemsByScope, CONTINUE_LIST_LIMIT, {
    types: ['document'],
  });
  if (items.length === 0) return null;

  const preview = items.slice(0, CONTINUE_VISIBLE_COUNT);
  const showSeeAll = items.length > CONTINUE_VISIBLE_COUNT;

  const scopeFallbacks = {
    personal: t('shell:nav.personal'),
    shared: t('shell:nav.shared'),
    team: t('shell:nav.team'),
    department: t('shell:nav.department'),
    company: t('shell:nav.company'),
  };

  const scopeLabelFor = (scopeKey: string) =>
    formatRecentScopeLabel(scopeKey, me?.identity ?? null, scopeFallbacks);

  const metaLineFor = (item: AggregatedRecentItem): string | null => {
    const parts: string[] = [];
    const scope = scopeLabelFor(item.scopeKey).trim();
    if (scope) parts.push(t('shell:continueReading.scopeMeta', { scope }));
    const ctx = item.contextName?.trim();
    if (ctx) parts.push(t('shell:continueReading.contextMeta', { context: ctx }));
    return parts.length > 0 ? parts.join(' · ') : null;
  };

  const goTo = (item: AggregatedRecentItem) => {
    closeAll();
    onNavigate();
    void navigate(`/documents/${item.id}`);
  };

  return (
    <Box mt={14} px={4}>
      <Group justify="space-between" align="center" gap="xs" wrap="nowrap" mb={2}>
        <Text size="sm" fw={600} c="dimmed" style={{ flexShrink: 0 }}>
          {t('shell:continueReading.title')}
        </Text>
        {showSeeAll ? (
          <UnstyledButton
            type="button"
            className="app-shell-continue-see-all"
            onClick={openAll}
            aria-label={t('shell:continueReading.seeAllAria')}
          >
            {t('shell:continueReading.seeAll')}
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
              {t('shell:continueReading.title')}
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
          <ContinueDetailedList items={items} onSelect={goTo} metaLineFor={metaLineFor} />
        </ScrollArea>
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={closeAll}>
            {t('common:actions.close')}
          </Button>
        </Group>
      </Modal>
    </Box>
  );
}
