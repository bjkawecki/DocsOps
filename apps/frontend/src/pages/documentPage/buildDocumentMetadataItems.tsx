import { Anchor, Box, Group, Stack, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../api/client.js';
import type { DocumentTypeDto } from '../../components/documents/documentTypeTypes.js';
import { TagBadge } from '../../components/ui/TagBadge.js';
import { DEFAULT_HEALTH_CHECK_INTERVAL_DAYS } from '../../lib/healthCheckIntervals.js';
import type { DocumentResponse } from './documentPageTypes';
import { DocumentChromeCollapsiblePanel } from './DocumentChromeCollapsiblePanel.js';

function formatUiDate(value: string, language: string): string | null {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const locale = language.startsWith('de') ? 'de-DE' : 'en-GB';
  return d.toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function isReviewDue(data: DocumentResponse, now: Date = new Date()): boolean {
  if (data.publishedAt == null || data.archivedAt != null || data.deletedAt != null) {
    return false;
  }
  if (data.healthCheckNeedsUpdate || data.healthCheckNeedsArchive) return false;
  if (data.healthCheckSnoozedUntil != null) {
    const snooze = new Date(data.healthCheckSnoozedUntil);
    if (!Number.isNaN(snooze.getTime()) && snooze > now) return false;
    if (!Number.isNaN(snooze.getTime()) && snooze <= now) return true;
  }
  if (data.healthCheckNextAt == null) return false;
  const nextAt = new Date(data.healthCheckNextAt);
  return !Number.isNaN(nextAt.getTime()) && nextAt <= now;
}

type FreshnessStandKind = 'archive' | 'needsUpdate' | 'due' | 'current';

function freshnessStandKind(data: DocumentResponse, now: Date = new Date()): FreshnessStandKind {
  if (data.healthCheckNeedsArchive) return 'archive';
  if (data.healthCheckNeedsUpdate) return 'needsUpdate';
  if (isReviewDue(data, now)) return 'due';
  return 'current';
}

function MetaRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box
      component="div"
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(7.5rem, 38%) 1fr',
        columnGap: 8,
        alignItems: 'start',
      }}
    >
      <Text size="sm" c="dimmed" style={{ lineHeight: 1.4 }}>
        {label}
      </Text>
      <Box style={{ minWidth: 0, lineHeight: 1.4 }}>{children}</Box>
    </Box>
  );
}

function useDocumentTypeLabel(
  documentTypeKey: string | null | undefined,
  contextId: string | null
): string | null {
  const { data } = useQuery({
    queryKey: ['document-types', contextId, 'sidebar-label', documentTypeKey],
    queryFn: async (): Promise<DocumentTypeDto[]> => {
      const params = new URLSearchParams();
      if (contextId) params.set('contextId', contextId);
      const res = await apiFetch(`/api/v1/document-types?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load document types');
      return ((await res.json()) as { items: DocumentTypeDto[] }).items;
    },
    enabled: documentTypeKey != null && documentTypeKey.length > 0,
  });

  if (!documentTypeKey) return null;
  const match = data?.find(
    (t) => t.documentTypeKey === documentTypeKey || t.id === documentTypeKey
  );
  if (match?.label) return match.label;
  if (documentTypeKey.startsWith('builtin:')) {
    return documentTypeKey
      .slice('builtin:'.length)
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
  return null;
}

function intervalDisplayLabel(
  data: DocumentResponse,
  t: (key: string, opts?: Record<string, unknown>) => string
): string {
  const orgDefault = data.healthCheckDefaultIntervalDays ?? DEFAULT_HEALTH_CHECK_INTERVAL_DAYS;
  const usingOrgDefault = data.healthCheckIntervalDays == null;
  const days = data.healthCheckIntervalDays ?? orgDefault;
  const daysLabel = t('healthCheck:interval.daysOption', { count: days });
  if (usingOrgDefault) {
    return t('healthCheck:interval.periodStandard', { period: daysLabel });
  }
  return daysLabel;
}

function setByLabel(
  data: DocumentResponse,
  t: (key: string, opts?: Record<string, unknown>) => string
): string {
  if (data.healthCheckLastDecision === 'still_valid' && data.healthCheckLastDecisionBy?.name) {
    return data.healthCheckLastDecisionBy.name;
  }
  return t('healthCheck:interval.setByAutomatic');
}

/**
 * Document type, version, freshness, tags and description for the document left column.
 */
export function DocumentSidebarMeta({ data }: { data: DocumentResponse }) {
  const { t, i18n } = useTranslation(['documents', 'healthCheck']);
  const versionNumber = data.currentPublishedVersionNumber;
  const tags = data.documentTags.filter((dt) => dt.tag.name.trim().length > 0);
  const description = data.description?.trim() || null;
  const typeLabel = useDocumentTypeLabel(data.documentTypeKey, data.contextId);
  const published = data.publishedAt != null;
  const publishedLabel = published ? formatUiDate(data.publishedAt!, i18n.language) : null;
  const nextCheckLabel = data.healthCheckNextAt
    ? formatUiDate(data.healthCheckNextAt, i18n.language)
    : null;
  const standKind = published ? freshnessStandKind(data) : null;
  const standNeedsAttention =
    standKind === 'due' || standKind === 'needsUpdate' || standKind === 'archive';
  const linkFreshness = standNeedsAttention && data.canRunHealthCheck === true;
  const documentTypeValue =
    typeLabel ??
    (data.documentTypeKey != null && data.documentTypeKey.length > 0
      ? data.documentTypeKey
      : t('sidebar.typeNone'));

  return (
    <DocumentChromeCollapsiblePanel
      sectionId="doc-page:details"
      title={t('sidebar.details')}
      defaultOpen={false}
      attention={standNeedsAttention}
      attentionLabel={standKind != null ? t(`healthCheck:status.${standKind}`) : undefined}
    >
      <Stack gap="sm" w="100%" px={4}>
        <Stack gap={6}>
          <MetaRow label={t('sidebar.documentTypeLabel')}>
            <Text size="sm">{documentTypeValue}</Text>
          </MetaRow>
          <MetaRow label={t('sidebar.versionLabel')}>
            <Text size="sm">
              {published && versionNumber != null ? String(versionNumber) : t('sidebar.draftValue')}
            </Text>
          </MetaRow>
          {published && publishedLabel != null ? (
            <MetaRow label={t('sidebar.publishedLabel')}>
              <Text size="sm">{publishedLabel}</Text>
            </MetaRow>
          ) : null}
          {published && standKind != null ? (
            <>
              <MetaRow label={t('healthCheck:status.label')}>
                {linkFreshness ? (
                  <Anchor component={Link} to="/freshness" size="sm" c="red.6" fw={500}>
                    {t(`healthCheck:status.${standKind}`)}
                  </Anchor>
                ) : (
                  <Text
                    size="sm"
                    c={standNeedsAttention ? 'red.6' : undefined}
                    fw={standNeedsAttention ? 500 : undefined}
                  >
                    {t(`healthCheck:status.${standKind}`)}
                  </Text>
                )}
              </MetaRow>
              <MetaRow label={t('healthCheck:interval.nextCheck')}>
                <Text
                  size="sm"
                  c={standKind === 'due' ? 'red.6' : undefined}
                  fw={standKind === 'due' ? 500 : undefined}
                >
                  {nextCheckLabel ?? t('healthCheck:interval.none')}
                </Text>
              </MetaRow>
              <MetaRow label={t('healthCheck:interval.setBy')}>
                <Text size="sm">{setByLabel(data, t)}</Text>
              </MetaRow>
              <MetaRow label={t('healthCheck:interval.label')}>
                <Text size="sm">{intervalDisplayLabel(data, t)}</Text>
              </MetaRow>
            </>
          ) : null}
          <MetaRow label={t('sidebar.tagsLabel')}>
            {tags.length > 0 ? (
              <Group gap={6} wrap="wrap" aria-label={t('sidebar.tagsAria')}>
                {tags.map((dt) => (
                  <TagBadge key={dt.tag.id} size="xs">
                    {dt.tag.name}
                  </TagBadge>
                ))}
              </Group>
            ) : (
              <Text size="sm">{t('sidebar.tagsNone')}</Text>
            )}
          </MetaRow>
        </Stack>
        {description != null ? (
          <Text size="sm" c="dimmed" style={{ lineHeight: 1.4 }}>
            {description}
          </Text>
        ) : null}
      </Stack>
    </DocumentChromeCollapsiblePanel>
  );
}
