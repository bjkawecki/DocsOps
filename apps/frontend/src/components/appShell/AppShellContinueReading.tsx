import {
  Box,
  Button,
  Group,
  Modal,
  ScrollArea,
  Stack,
  Text,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconClock, IconFileText } from '@tabler/icons-react';
import { useCallback, useLayoutEffect, useRef, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
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

function documentPath(item: AggregatedRecentItem): string {
  return `/documents/${item.id}`;
}

type Props = {
  isMiniRail: boolean;
  onNavigate: () => void;
};

/** Tooltip only when the label is visually truncated. */
function TruncationTooltip({ label, children }: { label: string; children: ReactElement }) {
  const labelRef = useRef<HTMLDivElement | null>(null);
  const [truncated, setTruncated] = useState(false);

  const measure = useCallback(() => {
    const el = labelRef.current?.querySelector<HTMLElement>(
      '.app-shell-continue-item-label, .app-shell-continue-item-title'
    );
    if (!el) {
      setTruncated(false);
      return;
    }
    setTruncated(el.scrollWidth > el.clientWidth + 1);
  }, []);

  useLayoutEffect(() => {
    measure();
    const el = labelRef.current;
    if (el == null || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [label, measure]);

  const wrapped = (
    <div ref={labelRef} style={{ minWidth: 0, width: '100%' }}>
      {children}
    </div>
  );

  if (!truncated) return wrapped;
  return (
    <Tooltip label={label} position="right" withArrow>
      {wrapped}
    </Tooltip>
  );
}

type CompactListProps = {
  items: AggregatedRecentItem[];
  onActivate: () => void;
};

function ContinueCompactList({ items, onActivate }: CompactListProps) {
  return (
    <Stack gap={2} align="stretch">
      {items.map((item) => {
        const label = itemLabel(item);
        return (
          <TruncationTooltip key={`${item.type}-${item.id}`} label={label}>
            <UnstyledButton
              component={Link}
              to={documentPath(item)}
              onClick={onActivate}
              className="app-shell-continue-item"
              aria-label={label}
            >
              <IconFileText size={ITEM_ICON_SIZE} stroke={1.5} aria-hidden />
              <Text size="md" fw={500} className="app-shell-continue-item-label">
                {label}
              </Text>
            </UnstyledButton>
          </TruncationTooltip>
        );
      })}
    </Stack>
  );
}

type DetailedListProps = {
  items: AggregatedRecentItem[];
  onActivate: () => void;
  metaLineFor: (item: AggregatedRecentItem) => string | null;
};

function ContinueDetailedList({ items, onActivate, metaLineFor }: DetailedListProps) {
  return (
    <Stack gap={10} align="stretch">
      {items.map((item) => {
        const label = itemLabel(item);
        const meta = metaLineFor(item);
        return (
          <TruncationTooltip key={`${item.type}-${item.id}`} label={label}>
            <UnstyledButton
              component={Link}
              to={documentPath(item)}
              onClick={onActivate}
              className="app-shell-continue-item app-shell-continue-item--detailed"
              aria-label={label}
            >
              <span className="app-shell-continue-item-icon">
                <IconFileText size={DETAILED_ITEM_ICON_SIZE} stroke={1.5} aria-hidden />
              </span>
              <span className="app-shell-continue-item-text">
                <Text size="md" fw={500} className="app-shell-continue-item-title" component="span">
                  {label}
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
          </TruncationTooltip>
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

  const onActivate = () => {
    closeAll();
    onNavigate();
  };

  return (
    <Box mt={14} px={4}>
      <Group justify="space-between" align="center" gap="xs" wrap="nowrap" mb={2}>
        <Text size="sm" fw={500} c="dimmed" style={{ flexShrink: 0 }}>
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
      <ContinueCompactList items={preview} onActivate={onActivate} />
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
          <ContinueDetailedList items={items} onActivate={onActivate} metaLineFor={metaLineFor} />
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
