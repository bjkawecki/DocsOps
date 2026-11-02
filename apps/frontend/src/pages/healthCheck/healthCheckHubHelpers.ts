import type { HealthCheckConfirmKind } from './HealthCheckActionButtons.js';

export type HealthCheckItemReason = 'due' | null;
export type HealthCheckItemOutcome = 'open' | 'needs_update' | 'archive';

export function formatHealthCheckDate(iso: string | null, language = 'de'): string {
  if (!iso) return '–';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '–';
  const locale = language.startsWith('de') ? 'de-DE' : 'en-GB';
  return d.toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function healthCheckReasonLabel(
  reason: HealthCheckItemReason,
  t: (key: string, opts?: Record<string, unknown>) => string
): string {
  if (reason === 'due') return t('reasons.due');
  return '–';
}

export function healthCheckOutcomeLabel(
  outcome: HealthCheckItemOutcome,
  t: (key: string, opts?: Record<string, unknown>) => string
): string {
  return t(`outcomes.${outcome}`);
}

export function healthCheckConfirmCopy(
  kind: HealthCheckConfirmKind,
  t: (key: string, opts?: Record<string, unknown>) => string
): { title: string; body: string; confirmLabel: string } {
  switch (kind) {
    case 'still_valid':
      return {
        title: t('confirmModal.stillValidTitle'),
        body: t('confirmModal.stillValidBody'),
        confirmLabel: t('actions.apply'),
      };
    case 'needs_update':
      return {
        title: t('confirmModal.needsUpdateTitle'),
        body: t('confirmModal.needsUpdateBody'),
        confirmLabel: t('actions.apply'),
      };
    case 'archive':
      return {
        title: t('confirmModal.archiveTitle'),
        body: t('confirmModal.archiveBody'),
        confirmLabel: t('actions.apply'),
      };
    case 'revoke_needs_update':
      return {
        title: t('confirmModal.revokeNeedsUpdateTitle'),
        body: t('confirmModal.revokeNeedsUpdateBody'),
        confirmLabel: t('actions.revoke'),
      };
    case 'revoke_archive':
      return {
        title: t('confirmModal.revokeArchiveTitle'),
        body: t('confirmModal.revokeArchiveBody'),
        confirmLabel: t('actions.revoke'),
      };
  }
}
