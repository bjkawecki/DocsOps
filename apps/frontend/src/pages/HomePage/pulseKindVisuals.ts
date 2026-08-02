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
  /** Document title plus scope/context. */
  subject: string;
};

function subjectLine(item: Pick<PulseItem, 'title' | 'meta'>, t: TranslateFn): string {
  const title = item.title.trim() || t('common:status.untitled');
  const parts: string[] = [title];
  const scope = item.meta.scopeName?.trim();
  const ctx = item.meta.contextName?.trim();
  if (scope) parts.push(t('home.pulseSubject.scope', { scope }));
  if (ctx) parts.push(t('home.pulseSubject.context', { context: ctx }));
  return parts.join(' · ');
}

function categoryKeyword(item: Pick<PulseItem, 'kind' | 'meta'>, t: TranslateFn): string {
  if (item.kind === 'review-decided' && item.meta.decision === 'rejected') {
    return t('home.pulseKeyword.reviewRejected');
  }
  const key = KEYWORD_KEY_BY_KIND[item.kind];
  return key ? t(key) : t('home.pulseKeyword.fallback');
}

/**
 * Line 1 = category label; line 2 = document · Scope: … · Context: ….
 * Category never includes colon or quantity (those stay out of the headline).
 */
export function getPulseDisplay(
  item: Pick<PulseItem, 'kind' | 'title' | 'body' | 'meta'>,
  t: TranslateFn
): PulseDisplay {
  return {
    keyword: categoryKeyword(item, t),
    detail: '',
    subject: subjectLine(item, t),
  };
}
