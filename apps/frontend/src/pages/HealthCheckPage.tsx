import {
  Anchor,
  Badge,
  Box,
  Button,
  Group,
  Loader,
  Modal,
  Select,
  Stack,
  Table,
  Text,
  Tooltip,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconFileCheck, IconRefresh } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { apiFetch } from '../api/client.js';
import { useMe } from '../hooks/useMe.js';
import { usePublicConfig } from '../hooks/usePublicConfig.js';
import {
  useSetAppShellBreadcrumbActions,
  useSetAppShellBreadcrumbs,
} from '../components/appShell/AppShellBreadcrumbsContext.js';
import { useSetAppShellNavScope } from '../components/appShell/AppShellNavScopeContext.js';
import { useWideLayout } from '../components/appShell/useWideLayout.js';
import { EntityListCard } from '../components/ui/EntityListCard.js';
import { PageMobileActionBar } from '../components/ui/PageMobileActionBar.js';
import {
  CompactListCount,
  StickySearchChrome,
  useCompactListFilterFab,
} from '../components/ui/StickySearchChrome.js';
import type { PageMobileAction } from '../components/ui/PageMobileActionBar.js';
import {
  DEFAULT_HEALTH_CHECK_INTERVAL_DAYS,
  healthCheckIntervalSelectData,
  type HealthCheckIntervalDays,
  isHealthCheckIntervalDays,
} from '../lib/healthCheckIntervals.js';
import {
  HealthCheckActionButtons,
  type HealthCheckConfirmKind,
} from './healthCheck/HealthCheckActionButtons.js';
import {
  formatHealthCheckDate,
  healthCheckConfirmCopy,
  healthCheckOutcomeLabel,
  healthCheckReasonLabel,
  type HealthCheckItemOutcome,
  type HealthCheckItemReason,
} from './healthCheck/healthCheckHubHelpers.js';

type ReasonFilter = 'all' | 'due';
type OutcomeFilter = 'all' | 'open' | 'needs_update' | 'archive';
type HubAction = 'still-valid' | 'needs-update' | 'archive' | 'clear-outcome';
type ConfirmKind = HealthCheckConfirmKind;

type HealthCheckItem = {
  documentId: string;
  title: string;
  reason: HealthCheckItemReason;
  outcome: HealthCheckItemOutcome;
  healthCheckNextAt: string | null;
  healthCheckNeedsUpdate: boolean;
  healthCheckNeedsArchive: boolean;
  healthCheckSnoozedUntil: string | null;
  contextId: string;
  contextName: string;
  ownerScopeLabel: string | null;
  attentionHint: 'high_traffic' | null;
};

type ScopeApiOption = {
  type: 'company' | 'department' | 'team';
  id: string;
  label: string;
};

type ListResponse = {
  items: HealthCheckItem[];
  total: number;
  limit: number;
  offset: number;
  scopes: ScopeApiOption[];
};

type ScopeOption =
  | { key: 'all'; label: string }
  | { key: string; label: string; scope: 'company' | 'department' | 'team'; id: string };

type ConfirmDraft = {
  item: HealthCheckItem;
  kind: ConfirmKind;
  intervalDays: HealthCheckIntervalDays;
};

export function HealthCheckPage() {
  const { t, i18n } = useTranslation(['healthCheck', 'common', 'shell']);
  const { data: me, isPending: mePending } = useMe();
  const { data: publicConfig } = usePublicConfig();
  const queryClient = useQueryClient();
  const isWide = useWideLayout();
  const [reason, setReason] = useState<ReasonFilter>('all');
  const [outcome, setOutcome] = useState<OutcomeFilter>('all');
  const [scopeKey, setScopeKey] = useState('all');
  const [draft, setDraft] = useState<ConfirmDraft | null>(null);

  const canAccess = me?.capabilities?.healthCheck === true;
  const demoMode = publicConfig?.demoMode === true;
  const demoDisabledReason = t('demoMutationsDisabled');

  useSetAppShellBreadcrumbs(
    isWide && canAccess
      ? [
          {
            key: 'freshness',
            label: t('breadcrumb'),
            icon: <IconFileCheck size={14} stroke={1.5} />,
          },
        ]
      : null
  );
  useSetAppShellNavScope(null);

  const listQueryKey = ['me', 'freshness', reason, outcome, scopeKey] as const;

  const listQuery = useQuery({
    queryKey: listQueryKey,
    enabled: canAccess,
    queryFn: async (): Promise<ListResponse> => {
      const params = new URLSearchParams();
      params.set('reason', reason);
      params.set('outcome', outcome);
      params.set('limit', '50');
      params.set('offset', '0');
      if (scopeKey !== 'all') {
        const [scope, id] = scopeKey.split(':');
        if (scope === 'company' || scope === 'department' || scope === 'team') {
          params.set('scope', scope);
          if (scope === 'company') params.set('companyId', id);
          if (scope === 'department') params.set('departmentId', id);
          if (scope === 'team') params.set('teamId', id);
        }
      }
      const res = await apiFetch(`/api/v1/me/freshness?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load health check list');
      return (await res.json()) as ListResponse;
    },
  });

  const scopeOptions = useMemo((): ScopeOption[] => {
    const opts: ScopeOption[] = [{ key: 'all', label: t('filters.scopeAll') }];
    for (const s of listQuery.data?.scopes ?? []) {
      opts.push({
        key: `${s.type}:${s.id}`,
        label: s.label,
        scope: s.type,
        id: s.id,
      });
    }
    return opts;
  }, [listQuery.data?.scopes, t]);

  const intervalSelectData = useMemo(
    () => healthCheckIntervalSelectData((days) => t('interval.daysOption', { count: days })),
    [t]
  );

  const scanMutation = useMutation({
    mutationFn: async () => {
      if (demoMode) throw new Error('demo disabled');
      const body: Record<string, string> = {};
      if (scopeKey !== 'all') {
        const [scope, id] = scopeKey.split(':');
        if (scope === 'company') body.companyId = id;
        if (scope === 'department') body.departmentId = id;
        if (scope === 'team') body.teamId = id;
      }
      const res = await apiFetch('/api/v1/me/freshness/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('scan failed');
      return (await res.json()) as { updatedDocumentIds: string[] };
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['me', 'freshness'] });
      notifications.show({
        color: 'green',
        message: t('scanDone', { count: data.updatedDocumentIds.length }),
      });
    },
    onError: () => {
      notifications.show({ color: 'red', message: t('scanFailed') });
    },
  });

  const actionMutation = useMutation({
    mutationFn: async (input: { documentId: string; action: HubAction; intervalDays?: number }) => {
      const path = `/api/v1/documents/${input.documentId}/freshness/${input.action}`;
      // Always send JSON `{}` (or interval body). Empty body + Content-Type: application/json
      // is rejected by Fastify (FST_ERR_CTP_EMPTY_JSON_BODY).
      const res = await apiFetch(path, {
        method: 'POST',
        body: JSON.stringify(
          input.action === 'still-valid' && input.intervalDays != null
            ? { intervalDays: input.intervalDays }
            : {}
        ),
      });
      if (!res.ok) throw new Error('action failed');
    },
    onSuccess: () => {
      setDraft(null);
      void queryClient.invalidateQueries({ queryKey: ['me', 'freshness'] });
      notifications.show({ color: 'green', message: t('actions.saved') });
    },
    onError: () => {
      notifications.show({ color: 'red', message: t('actions.failed') });
    },
  });

  const openConfirm = (item: HealthCheckItem, kind: ConfirmKind) => {
    if (demoMode) return;
    setDraft({
      item,
      kind,
      intervalDays: DEFAULT_HEALTH_CHECK_INTERVAL_DAYS,
    });
  };

  const confirmDraft = () => {
    if (!draft) return;
    const { item, kind, intervalDays } = draft;
    if (kind === 'still_valid') {
      actionMutation.mutate({
        documentId: item.documentId,
        action: 'still-valid',
        intervalDays,
      });
      return;
    }
    if (kind === 'needs_update') {
      actionMutation.mutate({ documentId: item.documentId, action: 'needs-update' });
      return;
    }
    if (kind === 'archive') {
      actionMutation.mutate({ documentId: item.documentId, action: 'archive' });
      return;
    }
    actionMutation.mutate({ documentId: item.documentId, action: 'clear-outcome' });
  };

  const chromeActions = useMemo(
    () =>
      canAccess ? (
        <Tooltip label={demoDisabledReason} disabled={!demoMode}>
          <Button
            size="xs"
            leftSection={<IconRefresh size={14} />}
            loading={scanMutation.isPending}
            disabled={demoMode}
            onClick={() => scanMutation.mutate()}
          >
            {t('scan')}
          </Button>
        </Tooltip>
      ) : null,
    [canAccess, demoMode, demoDisabledReason, scanMutation, t]
  );
  useSetAppShellBreadcrumbActions(
    chromeActions,
    `freshness:${canAccess}:${demoMode}:${scanMutation.isPending}`
  );

  const reasonSelect = (
    <Select
      label={t('filters.reason')}
      data={[
        { value: 'all', label: t('filters.reasonAll') },
        { value: 'due', label: t('filters.reasonDue') },
      ]}
      value={reason}
      onChange={(v) => {
        if (v === 'all' || v === 'due') setReason(v);
      }}
      allowDeselect={false}
      w={isWide ? 200 : undefined}
      style={isWide ? undefined : { flex: 1, minWidth: 0 }}
    />
  );

  const outcomeSelect = (
    <Select
      label={t('filters.outcome')}
      data={[
        { value: 'all', label: t('filters.outcomeAll') },
        { value: 'open', label: t('filters.outcomeOpen') },
        { value: 'needs_update', label: t('filters.outcomeNeedsUpdate') },
        { value: 'archive', label: t('filters.outcomeArchive') },
      ]}
      value={outcome}
      onChange={(v) => {
        if (v === 'all' || v === 'open' || v === 'needs_update' || v === 'archive') {
          setOutcome(v);
        }
      }}
      allowDeselect={false}
      w={isWide ? 220 : undefined}
      style={isWide ? undefined : { flex: 1, minWidth: 0 }}
    />
  );

  const scopeSelect = (
    <Select
      label={t('filters.scope')}
      data={scopeOptions.map((o) => ({ value: o.key, label: o.label }))}
      value={scopeKey}
      onChange={(v) => v && setScopeKey(v)}
      allowDeselect={false}
      w={isWide ? 240 : undefined}
      style={isWide ? undefined : { flex: 1, minWidth: 0 }}
    />
  );

  const filterFields = (
    <Group gap="md" wrap="wrap" align="flex-end" grow={!isWide}>
      {reasonSelect}
      {outcomeSelect}
      {scopeSelect}
    </Group>
  );

  const activeFilterCount =
    (reason !== 'all' ? 1 : 0) + (outcome !== 'all' ? 1 : 0) + (scopeKey !== 'all' ? 1 : 0);

  const compactFilter = useCompactListFilterFab({
    label: t('filters.reason'),
    active: activeFilterCount > 0,
    children: filterFields,
  });

  const scanMobileAction: PageMobileAction = useMemo(
    () => ({
      key: 'scan',
      label: demoMode ? demoDisabledReason : t('scan'),
      icon: <IconRefresh size={16} stroke={1.5} />,
      tone: 'secondary',
      loading: scanMutation.isPending,
      disabled: demoMode,
      onClick: () => scanMutation.mutate(),
    }),
    [demoMode, demoDisabledReason, scanMutation, t]
  );

  // Hooks above must run unconditionally; early returns after.
  if (mePending) {
    return <Loader size="sm" />;
  }

  if (!canAccess) {
    return (
      <Box>
        <Text c="dimmed">{t('noAccess')}</Text>
      </Box>
    );
  }

  const items = listQuery.data?.items ?? [];
  const total = listQuery.data?.total ?? items.length;
  const countLabel = listQuery.data != null ? t('itemCount', { count: total }) : '–';
  const copy = draft ? healthCheckConfirmCopy(draft.kind, t) : null;

  return (
    <Box>
      <Stack gap={isWide ? 'md' : 'sm'}>
        {isWide ? (
          <StickySearchChrome>
            <Group gap="md" wrap="wrap" align="flex-end">
              {reasonSelect}
              {outcomeSelect}
              {scopeSelect}
              <Text size="sm" c="dimmed" style={{ marginLeft: 'auto' }}>
                {countLabel}
              </Text>
            </Group>
          </StickySearchChrome>
        ) : (
          <>
            <CompactListCount>{countLabel}</CompactListCount>
            {compactFilter.panel}
          </>
        )}

        {listQuery.isPending ? (
          <Loader size="sm" />
        ) : listQuery.isError ? (
          <Text size="sm" c="red">
            {t('loadFailed')}
          </Text>
        ) : items.length === 0 ? (
          <Text size="sm" c="dimmed">
            {t('empty')}
          </Text>
        ) : isWide ? (
          <Box style={{ overflowX: 'auto' }}>
            <Table withTableBorder className="dense-list-table">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('columns.title')}</Table.Th>
                  <Table.Th>{t('columns.reason')}</Table.Th>
                  <Table.Th>{t('columns.outcome')}</Table.Th>
                  <Table.Th>{t('columns.nextAt')}</Table.Th>
                  <Table.Th>{t('columns.context')}</Table.Th>
                  <Table.Th>{t('columns.owner')}</Table.Th>
                  <Table.Th>{t('columns.actions')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {items.map((item) => (
                  <Table.Tr key={item.documentId}>
                    <Table.Td>
                      <Group gap={6} wrap="nowrap">
                        <Anchor
                          component={Link}
                          to={`/documents/${item.documentId}`}
                          size="sm"
                          fw={500}
                        >
                          {item.title}
                        </Anchor>
                        {item.attentionHint === 'high_traffic' ? (
                          <Badge size="xs" variant="light" color="gray">
                            {t('attention.highTraffic')}
                          </Badge>
                        ) : null}
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{healthCheckReasonLabel(item.reason, t)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{healthCheckOutcomeLabel(item.outcome, t)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">
                        {formatHealthCheckDate(item.healthCheckNextAt, i18n.language)}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{item.contextName}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{item.ownerScopeLabel ?? '–'}</Text>
                    </Table.Td>
                    <Table.Td>
                      <HealthCheckActionButtons
                        item={item}
                        loading={
                          actionMutation.isPending && draft?.item.documentId === item.documentId
                        }
                        disabled={demoMode}
                        disabledReason={demoDisabledReason}
                        onOpen={(kind) => openConfirm(item, kind)}
                        t={t}
                      />
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Box>
        ) : (
          <Stack gap="xs">
            {items.map((item) => {
              const metaParts = [
                healthCheckReasonLabel(item.reason, t),
                healthCheckOutcomeLabel(item.outcome, t),
                item.contextName,
                item.ownerScopeLabel,
                formatHealthCheckDate(item.healthCheckNextAt, i18n.language),
              ].filter((part): part is string => Boolean(part && part !== '–'));
              return (
                <EntityListCard
                  key={item.documentId}
                  title={
                    <Group gap={6} wrap="nowrap">
                      <Anchor
                        component={Link}
                        to={`/documents/${item.documentId}`}
                        fw={600}
                        size="md"
                        lineClamp={2}
                      >
                        {item.title}
                      </Anchor>
                      {item.attentionHint === 'high_traffic' ? (
                        <Badge size="xs" variant="light" color="gray">
                          {t('attention.highTraffic')}
                        </Badge>
                      ) : null}
                    </Group>
                  }
                  meta={
                    <Stack gap={8}>
                      {metaParts.length > 0 ? (
                        <Text size="xs" c="dimmed" lineClamp={2}>
                          {metaParts.join(' · ')}
                        </Text>
                      ) : null}
                      <HealthCheckActionButtons
                        item={item}
                        loading={
                          actionMutation.isPending && draft?.item.documentId === item.documentId
                        }
                        disabled={demoMode}
                        disabledReason={demoDisabledReason}
                        onOpen={(kind) => openConfirm(item, kind)}
                        t={t}
                      />
                    </Stack>
                  }
                />
              );
            })}
          </Stack>
        )}
      </Stack>

      <Modal
        opened={draft != null}
        onClose={() => {
          if (!actionMutation.isPending) setDraft(null);
        }}
        title={copy?.title}
        centered
      >
        {draft && copy ? (
          <Stack gap="md">
            <Text size="sm">{copy.body}</Text>
            {draft.kind === 'still_valid' ? (
              <Select
                label={t('confirmModal.intervalLabel')}
                data={intervalSelectData}
                value={String(draft.intervalDays)}
                onChange={(v) => {
                  const days = v != null ? Number(v) : NaN;
                  if (isHealthCheckIntervalDays(days)) {
                    setDraft({ ...draft, intervalDays: days });
                  }
                }}
                allowDeselect={false}
              />
            ) : null}
            <Group justify="flex-end" gap="sm">
              <Button
                variant="default"
                onClick={() => setDraft(null)}
                disabled={actionMutation.isPending}
              >
                {t('common:actions.cancel')}
              </Button>
              <Button onClick={confirmDraft} loading={actionMutation.isPending}>
                {copy.confirmLabel}
              </Button>
            </Group>
          </Stack>
        ) : null}
      </Modal>

      {!isWide ? (
        <PageMobileActionBar
          ariaLabel={t('shell:nav.pageMobileActionsAria')}
          actions={[compactFilter.action, scanMobileAction]}
        />
      ) : null}
    </Box>
  );
}
