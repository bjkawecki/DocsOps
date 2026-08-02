import { ActionIcon, Button, Group, Text, Tooltip, useMantineTheme } from '@mantine/core';
import { IconCircleCheck, IconX } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
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
  labelKey:
    | 'home.filters.drafts'
    | 'home.filters.reviews'
    | 'home.filters.decided'
    | 'home.filters.new'
    | 'home.filters.updated'
    | 'home.filters.comments';
  last24hKey?: keyof PulseStats;
}> = [
  { key: 'openDrafts', kind: 'draft-open', labelKey: 'home.filters.drafts' },
  { key: 'reviewsAwaiting', kind: 'review-awaiting', labelKey: 'home.filters.reviews' },
  { key: 'reviewsDecidedUnread', kind: 'review-decided', labelKey: 'home.filters.decided' },
  {
    key: 'newDocuments',
    kind: 'document-new',
    labelKey: 'home.filters.new',
    last24hKey: 'newDocumentsLast24h',
  },
  {
    key: 'updatedDocuments',
    kind: 'document-updated',
    labelKey: 'home.filters.updated',
    last24hKey: 'updatedDocumentsLast24h',
  },
  {
    key: 'comments',
    kind: 'document-comments',
    labelKey: 'home.filters.comments',
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

function timeGreetingKey(
  now: Date = new Date()
): 'home.goodMorning' | 'home.goodAfternoon' | 'home.goodEvening' {
  const h = now.getHours();
  if (h < 12) return 'home.goodMorning';
  if (h < 18) return 'home.goodAfternoon';
  return 'home.goodEvening';
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
  const { t } = useTranslation('documents');
  const { primaryColor } = useMantineTheme();
  const updateCount = sumUpdates(stats);
  const firstName = displayFirstName(userName);
  const greet = t(timeGreetingKey());
  const greetingText = firstName
    ? t('home.greeting', { greeting: greet, name: firstName })
    : t('home.greetingFallback', { greeting: greet });
  const statusText =
    updateCount === 0
      ? t('home.caughtUp')
      : updateCount === 1
        ? t('home.catchUpOne')
        : t('home.catchUpMany', { count: updateCount });
  const allCaughtUp = updateCount === 0;

  const visibleDefs = STAT_DEFS.filter((d) => stats[d.key] > 0 || activeKind === d.kind);

  return (
    <div className="pulse-stats">
      <div className="pulse-stats-header">
        <Text className="pulse-stats-greeting" c="dimmed">
          {greetingText}
        </Text>
        <div className="pulse-stats-status-row">
          {allCaughtUp ? (
            <span className="pulse-stats-status-icon" aria-hidden>
              <IconCircleCheck size={34} stroke={1.35} />
            </span>
          ) : null}
          <Text className="pulse-stats-status" fw={700}>
            {statusText}
          </Text>
        </div>
      </div>
      <Group gap="sm" wrap="wrap" role="toolbar" aria-label={t('home.filters.aria')}>
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
                {t(def.labelKey)}: {count}
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
            aria-label={t('home.filters.clear')}
          >
            <IconX size={16} stroke={1.75} />
          </ActionIcon>
        ) : null}
      </Group>
    </div>
  );
}
