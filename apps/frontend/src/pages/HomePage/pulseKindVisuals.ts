import {
  IconBuildingSkyscraper,
  IconFileCheck,
  IconFilePlus,
  IconFileSearch,
  IconFileText,
  IconGitMerge,
  IconMessageCircle,
  IconPencil,
  IconRefresh,
  IconSitemap,
  IconUser,
  IconUsersGroup,
  type TablerIcon,
} from '@tabler/icons-react';
import type { PulseItem, PulseItemKind } from '../../hooks/useMePulse.js';

export const PULSE_KIND_ICON: Record<PulseItemKind, TablerIcon> = {
  'draft-open': IconPencil,
  'review-awaiting': IconFileSearch,
  'review-decided': IconGitMerge,
  'document-new': IconFilePlus,
  'document-updated': IconRefresh,
  'document-comments': IconMessageCircle,
  'health-check-action-needed': IconFileCheck,
};

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

const PULSE_KIND_LABEL_KEY: Record<PulseItemKind, string> = {
  'draft-open': 'home.pulseKindLabel.draftOpen',
  'review-awaiting': 'home.pulseKindLabel.reviewAwaiting',
  'review-decided': 'home.pulseKindLabel.reviewDecided',
  'document-new': 'home.pulseKindLabel.documentNew',
  'document-updated': 'home.pulseKindLabel.documentUpdated',
  'document-comments': 'home.pulseKindLabel.documentComments',
  'health-check-action-needed': 'home.pulseKindLabel.healthCheck',
};

/** Bold category label on feed line 1 (no colon, no quantity). */
const KEYWORD_KEY_BY_KIND: Record<PulseItemKind, string> = {
  'draft-open': 'home.pulseKeyword.draftOpen',
  'review-awaiting': 'home.pulseKeyword.reviewAwaiting',
  'review-decided': 'home.pulseKeyword.reviewDecided',
  'document-new': 'home.pulseKeyword.documentNew',
  'document-updated': 'home.pulseKeyword.documentUpdated',
  'document-comments': 'home.pulseKeyword.documentComments',
  'health-check-action-needed': 'home.pulseKeyword.healthCheck',
};

export type PulseScopeType = NonNullable<PulseItem['meta']['scopeType']>;

export type PulseLocation = {
  scopeType: PulseScopeType;
  /** Context name, or scope name when no context. */
  label: string;
};

export function pulseKindIcon(kind: PulseItemKind): TablerIcon {
  return PULSE_KIND_ICON[kind] ?? IconFileText;
}

export function pulseKindLabel(kind: PulseItemKind, t: TranslateFn): string {
  const key = PULSE_KIND_LABEL_KEY[kind];
  return key ? t(key) : kind;
}

export function pulseScopeIcon(scopeType: PulseScopeType): TablerIcon {
  if (scopeType === 'company') return IconBuildingSkyscraper;
  if (scopeType === 'department') return IconSitemap;
  if (scopeType === 'team') return IconUsersGroup;
  return IconUser;
}

export type PulseDisplay = {
  /** Bold category label (no trailing colon). */
  keyword: string;
  /** Optional event detail after the keyword (usually empty). */
  detail: string;
  /** Document title (single line, truncated in UI). */
  subject: string;
  /** Scope icon + context/scope label; null when nothing to show. */
  location: PulseLocation | null;
};

function documentTitle(item: Pick<PulseItem, 'title' | 'documentId'>, t: TranslateFn): string {
  const raw = item.title.trim();
  // Never surface document IDs as titles (fallback / untitled docs).
  if (raw && raw !== item.documentId) return raw;
  return t('common:status.untitled');
}

function locationInfo(item: Pick<PulseItem, 'meta'>, t: TranslateFn): PulseLocation | null {
  const scopeType = item.meta.scopeType;
  if (scopeType == null) return null;

  const ctx = item.meta.contextName?.trim();
  const scopeName = item.meta.scopeName?.trim();

  if (ctx) return { scopeType, label: ctx };
  if (scopeType === 'personal') {
    return { scopeType, label: t('home.pulseSubject.scopePersonal') };
  }
  if (scopeName) return { scopeType, label: scopeName };
  return null;
}

function categoryKeyword(item: Pick<PulseItem, 'kind' | 'meta'>, t: TranslateFn): string {
  if (item.kind === 'review-decided' && item.meta.decision === 'rejected') {
    return t('home.pulseKeyword.reviewRejected');
  }
  const key = KEYWORD_KEY_BY_KIND[item.kind];
  return key ? t(key) : t('home.pulseKeyword.fallback');
}

/**
 * Line 1 = category; line 2 = document title; line 3 = scope icon + context/scope label.
 */
export function getPulseDisplay(
  item: Pick<PulseItem, 'kind' | 'title' | 'documentId' | 'body' | 'meta'>,
  t: TranslateFn
): PulseDisplay {
  if (item.kind === 'health-check-action-needed') {
    const count = typeof item.meta.count === 'number' ? item.meta.count : 0;
    const scopeLabel = item.title.trim() || t('home.pulseSubject.healthCheckFallback');
    return {
      keyword: categoryKeyword(item, t),
      detail: '',
      subject: `${scopeLabel} · ${t('home.pulseSubject.healthCheckCount', { count })}`,
      location: locationInfo(item, t),
    };
  }
  return {
    keyword: categoryKeyword(item, t),
    detail: '',
    subject: documentTitle(item, t),
    location: locationInfo(item, t),
  };
}
