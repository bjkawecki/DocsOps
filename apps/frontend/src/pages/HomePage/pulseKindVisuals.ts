import {
  IconFilePlus,
  IconFileSearch,
  IconFileText,
  IconGitMerge,
  IconMessageCircle,
  IconPencil,
  IconRefresh,
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
};

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

const PULSE_KIND_LABEL_KEY: Record<PulseItemKind, string> = {
  'draft-open': 'home.pulseKindLabel.draftOpen',
  'review-awaiting': 'home.pulseKindLabel.reviewAwaiting',
  'review-decided': 'home.pulseKindLabel.reviewDecided',
  'document-new': 'home.pulseKindLabel.documentNew',
  'document-updated': 'home.pulseKindLabel.documentUpdated',
  'document-comments': 'home.pulseKindLabel.documentComments',
};

/** Bold category label on feed line 1 (no colon, no quantity). */
const KEYWORD_KEY_BY_KIND: Record<PulseItemKind, string> = {
  'draft-open': 'home.pulseKeyword.draftOpen',
  'review-awaiting': 'home.pulseKeyword.reviewAwaiting',
  'review-decided': 'home.pulseKeyword.reviewDecided',
  'document-new': 'home.pulseKeyword.documentNew',
  'document-updated': 'home.pulseKeyword.documentUpdated',
  'document-comments': 'home.pulseKeyword.documentComments',
};

export function pulseKindIcon(kind: PulseItemKind): TablerIcon {
  return PULSE_KIND_ICON[kind] ?? IconFileText;
}

export function pulseKindLabel(kind: PulseItemKind, t: TranslateFn): string {
  const key = PULSE_KIND_LABEL_KEY[kind];
  return key ? t(key) : kind;
}

export type PulseDisplay = {
  /** Bold category label (no trailing colon). */
  keyword: string;
  /** Optional event detail after the keyword (usually empty). */
  detail: string;
  /** Document title (single line, truncated in UI). */
  subject: string;
  /** Scope · context (dimmed); null when nothing to show. */
  location: string | null;
};

function documentTitle(item: Pick<PulseItem, 'title' | 'documentId'>, t: TranslateFn): string {
  const raw = item.title.trim();
  // Never surface document IDs as titles (fallback / untitled docs).
  if (raw && raw !== item.documentId) return raw;
  return t('common:status.untitled');
}

function scopePart(item: Pick<PulseItem, 'meta'>, t: TranslateFn): string | null {
  const scopeType = item.meta.scopeType;
  if (scopeType === 'company') return t('home.pulseSubject.scopeCompany');
  if (scopeType === 'personal') return t('home.pulseSubject.scopePersonal');
  const name = item.meta.scopeName?.trim();
  return name || null;
}

function locationLine(item: Pick<PulseItem, 'meta'>, t: TranslateFn): string | null {
  const parts: string[] = [];
  const scope = scopePart(item, t);
  const ctx = item.meta.contextName?.trim();
  if (scope) parts.push(scope);
  if (ctx) parts.push(ctx);
  return parts.length > 0 ? parts.join(' · ') : null;
}

function categoryKeyword(item: Pick<PulseItem, 'kind' | 'meta'>, t: TranslateFn): string {
  if (item.kind === 'review-decided' && item.meta.decision === 'rejected') {
    return t('home.pulseKeyword.reviewRejected');
  }
  const key = KEYWORD_KEY_BY_KIND[item.kind];
  return key ? t(key) : t('home.pulseKeyword.fallback');
}

/**
 * Line 1 = category; line 2 = document title; line 3 = scope · context (dimmed).
 */
export function getPulseDisplay(
  item: Pick<PulseItem, 'kind' | 'title' | 'documentId' | 'body' | 'meta'>,
  t: TranslateFn
): PulseDisplay {
  return {
    keyword: categoryKeyword(item, t),
    detail: '',
    subject: documentTitle(item, t),
    location: locationLine(item, t),
  };
}
