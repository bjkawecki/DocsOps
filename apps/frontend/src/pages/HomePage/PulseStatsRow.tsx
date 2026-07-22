import { ActionIcon, Button, Group, Text, Tooltip, useMantineTheme } from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import type { PulseItemKind, PulseStats } from '../../hooks/useMePulse.js';

export type PulseStatKey =
  | 'openDrafts'
  | 'reviewsAwaiting'
  | 'reviewsDecidedUnread'
  | 'newDocuments'
  | 'updatedDocuments'
  | 'comments';

const STAT_DEFS: Array<{
  key: PulseStatKey;
  kind: PulseItemKind;
  shortLabel: string;
  last24hKey?: keyof PulseStats;
}> = [
  { key: 'openDrafts', kind: 'draft-open', shortLabel: 'Drafts' },
  { key: 'reviewsAwaiting', kind: 'review-awaiting', shortLabel: 'Reviews' },
  { key: 'reviewsDecidedUnread', kind: 'review-decided', shortLabel: 'Decided' },
  {
    key: 'newDocuments',
    kind: 'document-new',
    shortLabel: 'New',
    last24hKey: 'newDocumentsLast24h',
  },
  {
    key: 'updatedDocuments',
    kind: 'document-updated',
    shortLabel: 'Updated',
    last24hKey: 'updatedDocumentsLast24h',
  },
  {
    key: 'comments',
    kind: 'document-comments',
    shortLabel: 'Comments',
    last24hKey: 'commentsLast24h',
  },
];

function sumUpdates(stats: PulseStats): number {
  return (
    stats.openDrafts +
    stats.reviewsAwaiting +
    stats.reviewsDecidedUnread +
    stats.newDocuments +
    stats.updatedDocuments +
    stats.comments
  );
}

function timeGreeting(now: Date = new Date()): string {
  const h = now.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

/** True if the string looks like an email (not a display name). */
function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/**
 * First name for greeting; null if missing or email-shaped (avoids admin@…).
 */
function displayFirstName(fullName: string | undefined | null): string | null {
  const n = fullName?.trim();
  if (!n || looksLikeEmail(n)) return null;
  const first = n.split(/\s+/)[0] ?? null;
  if (first == null || looksLikeEmail(first)) return null;
  return first;
}

function updatesStatusLine(updateCount: number): string {
  if (updateCount === 0) {
    return "You're all caught up.";
  }
  const itemsLabel = updateCount === 1 ? '1 item' : `${updateCount} items`;
  return `Catch up when you're ready · ${itemsLabel}`;
}

type Props = {
  stats: PulseStats;
  activeKind: PulseItemKind | null;
  onSelectKind: (kind: PulseItemKind | null) => void;
  /** Display name from /me (first token used; emails ignored). */
  userName?: string | null;
};

/**
 * Soft greeting + updates status; xs outline/filled filter buttons in accent color.
 */
export function PulseStatsRow({ stats, activeKind, onSelectKind, userName }: Props) {
  const { primaryColor } = useMantineTheme();
  const updateCount = sumUpdates(stats);
  const firstName = displayFirstName(userName);
  const greet = timeGreeting();
  const greetingText = firstName ? `${greet}, ${firstName}` : greet;
  const statusText = updatesStatusLine(updateCount);

  const visibleDefs = STAT_DEFS.filter((d) => stats[d.key] > 0 || activeKind === d.kind);

  return (
    <div className="pulse-stats">
      <div className="pulse-stats-header">
        <Text className="pulse-stats-greeting" c="dimmed">
          {greetingText}
        </Text>
        <Text className="pulse-stats-status" fw={600}>
          {statusText}
        </Text>
      </div>
      <Group gap="sm" wrap="wrap" role="toolbar" aria-label="Pulse filters">
        {visibleDefs.map((def) => {
          const count = stats[def.key];
          const last24h = def.last24hKey != null ? stats[def.last24hKey] : null;
          const active = activeKind === def.kind;
          const tip =
            last24h != null && last24h > 0 && last24h < count
              ? `${last24h} in the last 24 hours`
              : undefined;
          return (
            <Tooltip key={def.key} label={tip} disabled={tip == null} withArrow color="dark">
              <Button
                size="xs"
                color={primaryColor}
                variant={active ? 'filled' : 'outline'}
                styles={
                  active
                    ? undefined
                    : {
                        root: {
                          borderColor: `var(--mantine-color-${primaryColor}-filled)`,
                          color: `var(--mantine-color-${primaryColor}-filled)`,
                        },
                      }
                }
                onClick={() => onSelectKind(active ? null : def.kind)}
                aria-pressed={active}
              >
                {def.shortLabel}: {count}
              </Button>
            </Tooltip>
          );
        })}
        {activeKind != null ? (
          <ActionIcon
            size="xs"
            variant="subtle"
            color="gray"
            onClick={() => onSelectKind(null)}
            aria-label="Clear filter"
          >
            <IconX size={16} stroke={1.75} />
          </ActionIcon>
        ) : null}
      </Group>
    </div>
  );
}
