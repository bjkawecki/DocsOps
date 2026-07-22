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

export const PULSE_KIND_LABEL: Record<PulseItemKind, string> = {
  'draft-open': 'Open draft',
  'review-awaiting': 'Review awaiting',
  'review-decided': 'Review decided',
  'document-new': 'New document',
  'document-updated': 'Updated document',
  'document-comments': 'Comments',
};

/** Bold category label on feed line 1 (no colon, no quantity). */
const KEYWORD_BY_KIND: Record<PulseItemKind, string> = {
  'draft-open': 'Draft unfinished',
  'review-awaiting': 'Review',
  'review-decided': 'Merged suggestion',
  'document-new': 'New Document',
  'document-updated': 'Updated Document',
  'document-comments': 'Comments',
};

export function pulseKindIcon(kind: PulseItemKind): TablerIcon {
  return PULSE_KIND_ICON[kind] ?? IconFileText;
}

export function pulseKindLabel(kind: PulseItemKind): string {
  return PULSE_KIND_LABEL[kind] ?? kind;
}

export type PulseDisplay = {
  /** Bold category label (no trailing colon). */
  keyword: string;
  /** Optional event detail after the keyword (usually empty). */
  detail: string;
  /** Document title plus scope/context. */
  subject: string;
};

function subjectLine(item: Pick<PulseItem, 'title' | 'meta'>): string {
  const title = item.title.trim() || 'Untitled';
  const parts: string[] = [title];
  const scope = item.meta.scopeName?.trim();
  const ctx = item.meta.contextName?.trim();
  if (scope) parts.push(`Scope: ${scope}`);
  if (ctx) parts.push(`Context: ${ctx}`);
  return parts.join(' · ');
}

function categoryKeyword(item: Pick<PulseItem, 'kind' | 'meta'>): string {
  if (item.kind === 'review-decided' && item.meta.decision === 'rejected') {
    return 'Rejected suggestion';
  }
  return KEYWORD_BY_KIND[item.kind] ?? 'Update';
}

/**
 * Line 1 = category label; line 2 = document · Scope: … · Context: ….
 * Category never includes colon or quantity (those stay out of the headline).
 */
export function getPulseDisplay(
  item: Pick<PulseItem, 'kind' | 'title' | 'body' | 'meta'>
): PulseDisplay {
  return {
    keyword: categoryKeyword(item),
    detail: '',
    subject: subjectLine(item),
  };
}
