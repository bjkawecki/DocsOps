import { Badge, Group, UnstyledButton } from '@mantine/core';
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
  label: string;
  last24hKey?: keyof PulseStats;
}> = [
  { key: 'openDrafts', kind: 'draft-open', label: 'Open drafts' },
  { key: 'reviewsAwaiting', kind: 'review-awaiting', label: 'Reviews awaiting' },
  { key: 'reviewsDecidedUnread', kind: 'review-decided', label: 'Reviews decided' },
  {
    key: 'newDocuments',
    kind: 'document-new',
    label: 'New documents',
    last24hKey: 'newDocumentsLast24h',
  },
  {
    key: 'updatedDocuments',
    kind: 'document-updated',
    label: 'Updated',
    last24hKey: 'updatedDocumentsLast24h',
  },
  {
    key: 'comments',
    kind: 'document-comments',
    label: 'Comments',
    last24hKey: 'commentsLast24h',
  },
];

type Props = {
  stats: PulseStats;
  activeKind: PulseItemKind | null;
  onSelectKind: (kind: PulseItemKind | null) => void;
};

/**
 * Compact pulse meters; click filters the feed by kind (toggle off when active).
 */
export function PulseStatsRow({ stats, activeKind, onSelectKind }: Props) {
  return (
    <Group gap="xs" wrap="wrap" role="toolbar" aria-label="Pulse filters">
      {STAT_DEFS.map((def) => {
        const count = stats[def.key];
        if (count === 0 && activeKind !== def.kind) return null;
        const last24h = def.last24hKey != null ? stats[def.last24hKey] : null;
        const active = activeKind === def.kind;
        const suffix =
          last24h != null && last24h > 0 && last24h < count ? ` · ${last24h} in 24h` : '';
        return (
          <UnstyledButton
            key={def.key}
            onClick={() => onSelectKind(active ? null : def.kind)}
            aria-pressed={active}
            style={{ borderRadius: 'var(--mantine-radius-sm)' }}
          >
            <Badge
              size="lg"
              variant={active ? 'filled' : 'light'}
              color={active ? undefined : 'gray'}
              style={{ cursor: 'pointer', textTransform: 'none', fontWeight: 500 }}
            >
              {count} {def.label}
              {suffix}
            </Badge>
          </UnstyledButton>
        );
      })}
    </Group>
  );
}
