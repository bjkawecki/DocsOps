import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Group,
  Paper,
  Stack,
  Table,
  Text,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconClipboardCheck } from '@tabler/icons-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../api/client';
import { notifyApiErrorResponse } from '../../lib/notifyApiError';
import { useSetAppShellBreadcrumbs } from '../../components/appShell/AppShellBreadcrumbsContext.js';
import { useSetAppShellNavScope } from '../../components/appShell/AppShellNavScopeContext.js';
import { useMeReviews, type ReviewPendingSuggestionsItem } from '../../hooks/useMeReviews';
import { useMeMoveRequests, type MeMoveRequestItem } from '../../hooks/useMeMoveRequests';
import { formatTableDate } from '../../lib/formatDate';
import { ApprovalsScopeSidebar, type ApprovalsSidebarDoc } from './ApprovalsScopeSidebar.js';

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
              <Table.Td>
                <Group gap="xs">
                  {item.canAccept ? (
                    <Button
                      size="compact-xs"
                      loading={busyId === item.id}
                      onClick={() => onAccept(item)}
                    >
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
              </Table.Td>
            </Table.Tr>
          ))
        )}
      </Table.Tbody>
    </Table>
  );
}

/** Approvals hub: Reviews (suggestions) + Move requests via content sidebar. */
export function ApprovalsPage() {
  const { t } = useTranslation('approvals');
  useSetAppShellBreadcrumbs([
    {
      key: 'approvals',
      label: t('breadcrumb'),
      icon: <IconClipboardCheck size={14} stroke={1.5} />,
    },
  ]);
  useSetAppShellNavScope(null);

  const [searchParams] = useSearchParams();
  const section = searchParams.get('tab') === 'moves' ? 'moves' : 'reviews';
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data, isPending, isError } = useMeReviews({ limit: 100, offset: 0 });
  const inbound = useMeMoveRequests({ direction: 'inbound', status: 'pending', limit: 100 });
  const outbound = useMeMoveRequests({ direction: 'outbound', status: 'pending', limit: 100 });

  const pending = data?.pendingForReview ?? [];
  const inboundItems = inbound.data?.items ?? [];
  const outboundItems = outbound.data?.items ?? [];
  const movesCount = inboundItems.length + outboundItems.length;

  const sidebarDocs: ApprovalsSidebarDoc[] = useMemo(
    () =>
      (data?.pendingForReview ?? []).map((item) => ({
        id: item.documentId,
        title: item.documentTitle?.trim() || t('reviews.untitledDocument'),
        scopeKey: scopeKeyForReview(item),
        scopeLabel: item.scopeName?.trim() || t('reviews.otherScope'),
      })),
    [data?.pendingForReview, t]
  );

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

  return (
    <Container fluid maw={1600} px="md" mb="xl">
      <Paper withBorder={false} p={0} radius="md">
        <Flex
          direction={{ base: 'column', lg: 'row' }}
          gap={{ base: 'md', lg: 'lg' }}
          align="flex-start"
        >
          <ApprovalsScopeSidebar
            section={section}
            documents={sidebarDocs}
            reviewsCount={pending.length}
            movesCount={movesCount}
          />

          <Box style={{ flex: 1, minWidth: 0, width: '100%' }}>
            {section === 'reviews' ? (
              isError ? (
                <Text size="sm" c="red">
                  {t('reviews.loadFailed')}
                </Text>
              ) : isPending ? (
                <Text size="sm" c="dimmed">
                  {t('loading')}
                </Text>
              ) : (
                <PendingReviewsTable items={pending} emptyLabel={t('reviews.empty')} />
              )
            ) : (
              <Stack gap="lg">
                <Box>
                  <Text fw={600} mb="xs">
                    {t('moves.inbound')}
                  </Text>
                  {inbound.isError ? (
                    <Text size="sm" c="red">
                      {t('moves.inboundLoadFailed')}
                    </Text>
                  ) : inbound.isPending ? (
                    <Text size="sm" c="dimmed">
                      {t('loading')}
                    </Text>
                  ) : (
                    <MoveRequestsTable
                      items={inboundItems}
                      emptyLabel={t('moves.inboundEmpty')}
                      busyId={busyId}
                      onAccept={(item) => void decide(item, 'accept', t('moves.toasts.accepted'))}
                      onReject={(item) => void decide(item, 'reject', t('moves.toasts.rejected'))}
                      onWithdraw={() => undefined}
                    />
                  )}
                </Box>
                <Box>
                  <Text fw={600} mb="xs">
                    {t('moves.outbound')}
                  </Text>
                  {outbound.isError ? (
                    <Text size="sm" c="red">
                      {t('moves.outboundLoadFailed')}
                    </Text>
                  ) : outbound.isPending ? (
                    <Text size="sm" c="dimmed">
                      {t('loading')}
                    </Text>
                  ) : (
                    <MoveRequestsTable
                      items={outboundItems}
                      emptyLabel={t('moves.outboundEmpty')}
                      busyId={busyId}
                      onAccept={() => undefined}
                      onReject={() => undefined}
                      onWithdraw={(item) =>
                        void decide(item, 'withdraw', t('moves.toasts.withdrawn'))
                      }
                    />
                  )}
                </Box>
              </Stack>
            )}
          </Box>
        </Flex>
      </Paper>
    </Container>
  );
}

export const ReviewsPage = ApprovalsPage;
