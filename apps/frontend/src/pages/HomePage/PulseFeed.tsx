import { useEffect, useRef, useState } from 'react';
import { ActionIcon, Loader, Text, useMantineTheme } from '@mantine/core';
import { IconCircleCheck } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import {
  isPulseActivityKind,
  useMarkPulseItemRead,
  type PulseItem,
  type PulseItemKind,
} from '../../hooks/useMePulse.js';
import {
  formatPulseDayLabel,
  formatPulseOccurredAt,
  pulseDayKey,
} from './formatPulseOccurredAt.js';
import { getPulseDisplay, pulseKindIcon } from './pulseKindVisuals.js';

const ICON_SIZE = 16;
/** Brief confirm blink before collapse. */
const BLINK_MS = 180;
/** Fallback if transitionend does not fire. */
const COLLAPSE_FALLBACK_MS = 400;

function KindIcon({ kind }: { kind: PulseItemKind }) {
  const Icon = pulseKindIcon(kind);
  return <Icon size={ICON_SIZE} stroke={1.75} className="pulse-feed-row-icon-svg" aria-hidden />;
}

type DayGroup = {
  dayKey: string;
  label: string;
  items: PulseItem[];
};

function groupByDay(items: PulseItem[]): DayGroup[] {
  const groups: DayGroup[] = [];
  for (const item of items) {
    const key = pulseDayKey(item.occurredAt);
    const last = groups[groups.length - 1];
    if (last && last.dayKey === key) {
      last.items.push(item);
    } else {
      groups.push({
        dayKey: key,
        label: formatPulseDayLabel(item.occurredAt),
        items: [item],
      });
    }
  }
  return groups;
}

type ItemProps = {
  item: PulseItem;
  mock: boolean;
  dismissing: boolean;
  onDismissStart: (itemId: string) => void;
  onDismissComplete: (itemId: string) => void;
};

function PulseFeedItem({ item, mock, dismissing, onDismissStart, onDismissComplete }: ItemProps) {
  const navigate = useNavigate();
  const theme = useMantineTheme();
  const markRead = useMarkPulseItemRead();
  const showDismiss = isPulseActivityKind(item.kind);
  const [confirmed, setConfirmed] = useState(false);
  const [blinking, setBlinking] = useState(false);
  const blinkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rowRef = useRef<HTMLDivElement | null>(null);
  const finishOnce = useRef(false);
  const display = getPulseDisplay(item);

  const finishDismiss = () => {
    if (finishOnce.current) return;
    finishOnce.current = true;
    if (fallbackTimer.current) {
      clearTimeout(fallbackTimer.current);
      fallbackTimer.current = null;
    }
    if (!mock) {
      markRead.mutate(item.id, {
        onSettled: () => onDismissComplete(item.id),
      });
      return;
    }
    onDismissComplete(item.id);
  };
  const finishDismissRef = useRef(finishDismiss);
  finishDismissRef.current = finishDismiss;

  useEffect(() => {
    return () => {
      if (blinkTimer.current) clearTimeout(blinkTimer.current);
      if (fallbackTimer.current) clearTimeout(fallbackTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!dismissing || !rowRef.current) return;
    const el = rowRef.current;
    const onEnd = (ev: TransitionEvent) => {
      if (ev.target !== el) return;
      if (ev.propertyName !== 'max-height') return;
      finishDismissRef.current();
    };
    el.addEventListener('transitionend', onEnd);
    fallbackTimer.current = setTimeout(() => {
      finishDismissRef.current();
    }, COLLAPSE_FALLBACK_MS);
    return () => {
      el.removeEventListener('transitionend', onEnd);
      if (fallbackTimer.current) clearTimeout(fallbackTimer.current);
    };
  }, [dismissing]);

  const openItem = () => {
    void navigate(item.href);
  };

  const onMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (dismissing || confirmed) return;
    const el = rowRef.current;
    const startH = el?.offsetHeight ?? null;
    finishOnce.current = false;
    if (el && startH != null) {
      el.style.maxHeight = `${startH}px`;
      void el.offsetHeight;
    }
    setConfirmed(true);
    setBlinking(true);
    if (blinkTimer.current) clearTimeout(blinkTimer.current);
    blinkTimer.current = setTimeout(() => {
      onDismissStart(item.id);
    }, BLINK_MS);
  };

  return (
    <div
      ref={rowRef}
      role="link"
      tabIndex={0}
      className={['pulse-feed-row', dismissing ? 'pulse-feed-row--dismissing' : '']
        .filter(Boolean)
        .join(' ')}
      onClick={openItem}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openItem();
        }
      }}
    >
      <span className="pulse-feed-row-icon">
        <KindIcon kind={item.kind} />
      </span>
      <span className="pulse-feed-row-text">
        <span className="pulse-feed-row-headline">
          <span className="pulse-feed-row-keyword">{display.keyword}</span>
        </span>
        <Text className="pulse-feed-row-subject" c="dimmed" lineClamp={1} component="span">
          {display.subject}
        </Text>
      </span>
      <span className="pulse-feed-row-end">
        <span className="pulse-feed-row-time">{formatPulseOccurredAt(item.occurredAt)}</span>
        {showDismiss ? (
          <ActionIcon
            className={`pulse-feed-row-action${blinking ? ' pulse-feed-row-action--blink' : ''}`}
            variant={confirmed ? 'filled' : 'default'}
            color={confirmed ? theme.primaryColor : 'gray'}
            size="md"
            aria-label="Mark as read"
            onClick={onMarkAsRead}
            disabled={!mock && markRead.isPending}
          >
            <IconCircleCheck size={18} />
          </ActionIcon>
        ) : null}
      </span>
    </div>
  );
}

type Props = {
  items: PulseItem[];
  mock?: boolean;
  onDismiss: (itemId: string) => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
};

function findScrollParent(el: HTMLElement | null): HTMLElement | null {
  let n: HTMLElement | null = el;
  while (n) {
    const oy = getComputedStyle(n).overflowY;
    if (
      (oy === 'auto' || oy === 'scroll' || oy === 'overlay') &&
      n.scrollHeight > n.clientHeight + 1
    ) {
      return n;
    }
    n = n.parentElement;
  }
  return null;
}

export function PulseFeed({
  items,
  mock = false,
  onDismiss,
  hasNextPage = false,
  isFetchingNextPage = false,
  onLoadMore,
}: Props) {
  const [dismissingIds, setDismissingIds] = useState<Set<string>>(() => new Set());
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const groups = groupByDay(items);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNextPage || !onLoadMore) return;
    const root = findScrollParent(el);
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) onLoadMore();
      },
      { root, rootMargin: '240px', threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, onLoadMore, items.length]);

  return (
    <div className="pulse-feed">
      {groups.map((group) => (
        <section key={group.dayKey} className="pulse-feed-day-group" aria-label={group.label}>
          <div className="pulse-feed-day-label">{group.label}</div>
          <div className="pulse-feed-day-rows">
            {group.items.map((item) => (
              <PulseFeedItem
                key={item.id}
                item={item}
                mock={mock}
                dismissing={dismissingIds.has(item.id)}
                onDismissStart={(id) => {
                  setDismissingIds((prev) => {
                    const next = new Set(prev);
                    next.add(id);
                    return next;
                  });
                }}
                onDismissComplete={(id) => {
                  setDismissingIds((prev) => {
                    const next = new Set(prev);
                    next.delete(id);
                    return next;
                  });
                  onDismiss(id);
                }}
              />
            ))}
          </div>
        </section>
      ))}
      {hasNextPage ? (
        <div ref={sentinelRef} className="pulse-feed-sentinel" aria-hidden>
          {isFetchingNextPage ? <Loader size="sm" /> : null}
        </div>
      ) : null}
    </div>
  );
}
