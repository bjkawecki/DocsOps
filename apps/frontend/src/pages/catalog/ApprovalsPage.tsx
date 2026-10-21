import { Badge, Box, Button, Group, NavLink, Stack, Table, Text } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconInbox } from '@tabler/icons-react';
import { useMemo, useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../api/client';
import { notifyApiErrorResponse } from '../../lib/notifyApiError';
import { WIDE_MIN_WIDTH } from '../../components/appShell/appShellLayoutConstants.js';
import { EntityListCard } from '../../components/ui/EntityListCard.js';
import { useMe } from '../../hooks/useMe';
import { useMeReviews, type ReviewPendingSuggestionsItem } from '../../hooks/useMeReviews';
import { useMeMoveRequests, type MeMoveRequestItem } from '../../hooks/useMeMoveRequests';
import { formatTableDate } from '../../lib/formatDate';
import { PersonalAreaPageChrome } from '../account/PersonalAreaPageChrome.js';

const nestedListStyle: CSSProperties = {
  borderLeft: '1px solid var(--mantine-color-default-border)',
  marginLeft: 14,
  paddingLeft: 8,
  marginTop: 4,
};

const navLinkFullWidth = {
  borderRadius: 'var(--mantine-radius-sm)',
  width: '100%',
} as const;

function documentDraftLink(documentId: string): string {
  return `/documents/${documentId}?mode=edit&tab=draft`;
}

function scopeKeyForReview(item: ReviewPendingSuggestionsItem): string {
  return `${item.scopeType}:${item.scopeId ?? 'none'}`;
}

function PendingReviewsTable({
  items,
  emptyLabel,
}: {
  items: ReviewPendingSuggestionsItem[];
  emptyLabel: string;
}) {
  const { t } = useTranslation('approvals');
  const isWide = useMediaQuery(WIDE_MIN_WIDTH) ?? true;

  if (!isWide) {
    if (items.length === 0) {
      return (
        <Text size="sm" c="dimmed">
          {emptyLabel}
        </Text>
      );
    }
    return (
      <Stack gap={0}>
        {items.map((item) => (
          <EntityListCard
            key={item.documentId}
            variant="flat"
            to={documentDraftLink(item.documentId)}
            title={item.documentTitle}
            meta={
              <Stack gap={2}>
                <Text size="xs" c="dimmed">
                  {item.scopeName}
                </Text>
                <Text size="xs" c="dimmed">
                  {item.lastSuggestionAt ? formatTableDate(item.lastSuggestionAt) : '–'}
                </Text>
              </Stack>
            }
            rightSection={
              <Badge size="sm" variant="light" color="yellow">
                {item.pendingSuggestionCount}
              </Badge>
            }
          />
        ))}
      </Stack>
    );
  }

  return (
    <Table withTableBorder className="dense-list-table">
      <Table.Thead>
        <Table.Tr>
          <Table.Th>{t('reviews.table.document')}</Table.Th>
          <Table.Th>{t('reviews.table.scope')}</Table.Th>
          <Table.Th>{t('reviews.table.pending')}</Table.Th>
          <Table.Th>{t('reviews.table.authors')}</Table.Th>
          <Table.Th>{t('reviews.table.lastSuggestion')}</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {items.length === 0 ? (
          <Table.Tr>
            <Table.Td colSpan={5}>
              <Text size="sm" c="dimmed">
                {emptyLabel}
              </Text>
            </Table.Td>
          </Table.Tr>
        ) : (
          items.map((item) => (
            <Table.Tr key={item.documentId}>
              <Table.Td>
                <Text
                  component={Link}
                  to={documentDraftLink(item.documentId)}
                  size="sm"
                  fw={500}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  {item.documentTitle}
                </Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm">{item.scopeName}</Text>
              </Table.Td>
              <Table.Td>
                <Badge size="sm" variant="light" color="yellow">
                  {item.pendingSuggestionCount}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Text size="sm">{item.authorIds.length}</Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm">
                  {item.lastSuggestionAt ? formatTableDate(item.lastSuggestionAt) : '–'}
                </Text>
              </Table.Td>
            </Table.Tr>
          ))
        )}
      </Table.Tbody>
    </Table>
  );
}

function MoveRequestsTable({
  items,
  emptyLabel,
  busyId,
  onAccept,
  onReject,
  onWithdraw,
}: {
  items: MeMoveRequestItem[];
  emptyLabel: string;
  busyId: string | null;
  onAccept: (item: MeMoveRequestItem) => void;
  onReject: (item: MeMoveRequestItem) => void;
  onWithdraw: (item: MeMoveRequestItem) => void;
}) {
  const { t } = useTranslation('approvals');
  const isWide = useMediaQuery(WIDE_MIN_WIDTH) ?? true;

  const actionButtons = (item: MeMoveRequestItem) => (
    <Group gap="xs" wrap="wrap">
      {item.canAccept ? (
        <Button size="compact-xs" loading={busyId === item.id} onClick={() => onAccept(item)}>
          {t('moves.actions.accept')}
        </Button>
      ) : null}
      {item.canReject ? (
        <Button
          size="compact-xs"
          variant="default"
          loading={busyId === item.id}
          onClick={() => onReject(item)}
        >
          {t('moves.actions.reject')}
        </Button>
      ) : null}
      {item.canWithdraw ? (
        <Button
          size="compact-xs"
          variant="light"
          color="gray"
          loading={busyId === item.id}
          onClick={() => onWithdraw(item)}
        >
          {t('moves.actions.withdraw')}
        </Button>
      ) : null}
    </Group>
  );

  if (!isWide) {
    if (items.length === 0) {
      return (
        <Text size="sm" c="dimmed">
          {emptyLabel}
        </Text>
      );
    }
    return (
      <Stack gap={0}>
        {items.map((item) => (
          <EntityListCard
            key={item.id}
            variant="flat"
            title={item.documentTitle}
            meta={
              <Stack gap={4}>
                <Text size="xs" c="dimmed">
                  {item.fromScopeName} → {item.toScopeName}
                </Text>
                <Text size="xs" c="dimmed">
                  {formatTableDate(item.createdAt)}
                  {item.requestedByName
                    ? ` · ${t('moves.requestedBy', { name: item.requestedByName })}`
                    : ''}
                </Text>
                {item.note ? (
                  <Text size="xs" c="dimmed" lineClamp={2}>
                    {item.note}
                  </Text>
                ) : null}
                {actionButtons(item)}
              </Stack>
            }
          />
        ))}
      </Stack>
    );
  }

  return (
    <Table withTableBorder className="dense-list-table">
      <Table.Thead>
        <Table.Tr>
          <Table.Th>{t('moves.table.document')}</Table.Th>
          <Table.Th>{t('moves.table.from')}</Table.Th>
          <Table.Th>{t('moves.table.to')}</Table.Th>
          <Table.Th>{t('moves.table.requested')}</Table.Th>
          <Table.Th>{t('moves.table.actions')}</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {items.length === 0 ? (
          <Table.Tr>
            <Table.Td colSpan={5}>
              <Text size="sm" c="dimmed">
                {emptyLabel}
              </Text>
            </Table.Td>
          </Table.Tr>
        ) : (
          items.map((item) => (
            <Table.Tr key={item.id}>
              <Table.Td>
                <Stack gap={2}>
                  <Text
                    component={Link}
                    to={`/documents/${item.documentId}`}
                    size="sm"
                    fw={500}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    {item.documentTitle}
                  </Text>
                  {item.note ? (
                    <Text size="xs" c="dimmed">
                      {item.note}
                    </Text>
                  ) : null}
                </Stack>
              </Table.Td>
              <Table.Td>
                <Text size="sm">{item.fromScopeName}</Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm">{item.toScopeName}</Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm">{formatTableDate(item.createdAt)}</Text>
                {item.requestedByName ? (
                  <Text size="xs" c="dimmed">
                    {t('moves.requestedBy', { name: item.requestedByName })}
                  </Text>
                ) : null}
              </Table.Td>
              <Table.Td>{actionButtons(item)}</Table.Td>
            </Table.Tr>
          ))
        )}
      </Table.Tbody>
    </Table>
  );
}

/** Approvals hub in personal shell: Reviews + Move requests. */
export function ApprovalsPage() {
  const { t } = useTranslation(['approvals', 'shell']);
  const { data: me } = useMe();

  const [searchParams] = useSearchParams();
  const section = searchParams.get('tab') === 'moves' ? 'moves' : 'reviews';
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState<string | null>(null);

  const isPlatformAdmin = me?.user?.isAdmin === true;
  const { data, isPending, isError } = useMeReviews(
    { limit: 100, offset: 0 },
    { enabled: !isPlatformAdmin }
  );
  const inbound = useMeMoveRequests(
    { direction: 'inbound', status: 'pending', limit: 100 },
    { enabled: !isPlatformAdmin }
  );
  const outbound = useMeMoveRequests(
    { direction: 'outbound', status: 'pending', limit: 100 },
    { enabled: !isPlatformAdmin }
  );

  const pending = useMemo(() => data?.pendingForReview ?? [], [data?.pendingForReview]);
  const inboundItems = inbound.data?.items ?? [];
  const outboundItems = outbound.data?.items ?? [];
  const movesCount = inboundItems.length + outboundItems.length;

  const reviewsNested = useMemo(() => {
    if (section !== 'reviews' || pending.length === 0) return null;
    const map = new Map<string, { label: string; docs: { id: string; title: string }[] }>();
    for (const item of pending) {
      const key = scopeKeyForReview(item);
      const label = item.scopeName?.trim() || t('approvals:reviews.otherScope');
      const title = item.documentTitle?.trim() || t('approvals:reviews.untitledDocument');
      const existing = map.get(key);
      if (existing) {
        existing.docs.push({ id: item.documentId, title });
      } else {
        map.set(key, { label, docs: [{ id: item.documentId, title }] });
      }
    }
    const groups = [...map.entries()]
      .map(([key, value]) => ({ key, ...value }))
      .sort((a, b) => a.label.localeCompare(b.label));
    return (
      <Box style={nestedListStyle}>
        <Stack gap={6} align="stretch" w="100%">
          {groups.map((group) => (
            <Box key={group.key}>
              <Text size="xs" c="dimmed" fw={600} px={8} mb={4} truncate>
                {group.label}
              </Text>
              <Stack gap={2} align="stretch" w="100%">
                {group.docs.map((d) => (
                  <NavLink
                    key={d.id}
                    component={Link}
                    to={documentDraftLink(d.id)}
                    label={d.title}
                    variant="subtle"
                    style={navLinkFullWidth}
                  />
                ))}
              </Stack>
            </Box>
          ))}
        </Stack>
      </Box>
    );
  }, [pending, section, t]);

  const invalidateMoves = () => {
    void queryClient.invalidateQueries({ queryKey: ['me', 'move-requests'] });
    void queryClient.invalidateQueries({ queryKey: ['me', 'reviews'] });
  };

  const decide = async (
    item: MeMoveRequestItem,
    action: 'accept' | 'reject' | 'withdraw',
    successTitle: string
  ) => {
    setBusyId(item.id);
    try {
      const res = await apiFetch(
        `/api/v1/documents/${item.documentId}/move-requests/${item.id}/${action}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }
      );
      if (res.ok) {
        notifications.show({ title: successTitle, message: item.documentTitle, color: 'green' });
        invalidateMoves();
        void queryClient.invalidateQueries({ queryKey: ['document', item.documentId] });
        void queryClient.invalidateQueries({ queryKey: ['catalog-documents'] });
      } else {
        void notifyApiErrorResponse(res);
      }
    } finally {
      setBusyId(null);
    }
  };

  const trailSuffix = useMemo(
    () => [
      {
        key: 'approvals',
        label: t('approvals:breadcrumb'),
        to: '/personal/approvals',
        icon: <IconInbox size={14} stroke={1.5} />,
      },
      {
        key: section === 'moves' ? 'moves' : 'reviews',
        label: section === 'moves' ? t('approvals:nav.moveRequests') : t('approvals:nav.reviews'),
      },
    ],
    [section, t]
  );

  if (isPlatformAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <PersonalAreaPageChrome
      trailSuffix={trailSuffix}
      reviewsNested={reviewsNested}
      reviewsCount={pending.length}
      movesCount={movesCount}
    >
      {section === 'reviews' ? (
        isError ? (
          <Text size="sm" c="red">
            {t('approvals:reviews.loadFailed')}
          </Text>
        ) : isPending ? (
          <Text size="sm" c="dimmed">
            {t('approvals:loading')}
          </Text>
        ) : (
          <PendingReviewsTable items={pending} emptyLabel={t('approvals:reviews.empty')} />
        )
      ) : (
        <Stack gap="lg">
          <Box>
            <Text fw={600} mb="xs">
              {t('approvals:moves.inbound')}
            </Text>
            {inbound.isError ? (
              <Text size="sm" c="red">
                {t('approvals:moves.inboundLoadFailed')}
              </Text>
            ) : inbound.isPending ? (
              <Text size="sm" c="dimmed">
                {t('approvals:loading')}
              </Text>
            ) : (
              <MoveRequestsTable
                items={inboundItems}
                emptyLabel={t('approvals:moves.inboundEmpty')}
                busyId={busyId}
                onAccept={(item) =>
                  void decide(item, 'accept', t('approvals:moves.toasts.accepted'))
                }
                onReject={(item) =>
                  void decide(item, 'reject', t('approvals:moves.toasts.rejected'))
                }
                onWithdraw={() => undefined}
              />
            )}
          </Box>
          <Box>
            <Text fw={600} mb="xs">
              {t('approvals:moves.outbound')}
            </Text>
            {outbound.isError ? (
              <Text size="sm" c="red">
                {t('approvals:moves.outboundLoadFailed')}
              </Text>
            ) : outbound.isPending ? (
              <Text size="sm" c="dimmed">
                {t('approvals:loading')}
              </Text>
            ) : (
              <MoveRequestsTable
                items={outboundItems}
                emptyLabel={t('approvals:moves.outboundEmpty')}
                busyId={busyId}
                onAccept={() => undefined}
                onReject={() => undefined}
                onWithdraw={(item) =>
                  void decide(item, 'withdraw', t('approvals:moves.toasts.withdrawn'))
                }
              />
            )}
          </Box>
        </Stack>
      )}
    </PersonalAreaPageChrome>
  );
}

export const ReviewsPage = ApprovalsPage;
