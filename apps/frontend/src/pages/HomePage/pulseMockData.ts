import type { MePulseResponse, PulseItem, PulseItemKind } from '../../hooks/useMePulse.js';

const HOUR = 60 * 60 * 1000;
export const PULSE_MOCK_STORAGE_KEY = 'docsops.pulseMock';

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * HOUR).toISOString();
}

function readPulseMockStorage(): boolean {
  if (typeof sessionStorage === 'undefined') return false;
  try {
    return sessionStorage.getItem(PULSE_MOCK_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function writePulseMockStorage(enabled: boolean): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    if (enabled) sessionStorage.setItem(PULSE_MOCK_STORAGE_KEY, '1');
    else sessionStorage.removeItem(PULSE_MOCK_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Dev-only: query `pulseMock=1` or sessionStorage flag. */
export function shouldUsePulseMock(searchParams: URLSearchParams): boolean {
  if (import.meta.env.DEV !== true) return false;
  if (searchParams.get('pulseMock') === '1') return true;
  return readPulseMockStorage();
}

export function isPulseMockEnabledInSession(): boolean {
  if (import.meta.env.DEV !== true) return false;
  return readPulseMockStorage();
}

function buildMockBody(kind: PulseItemKind, meta: PulseItem['meta']): string {
  switch (kind) {
    case 'document-new':
      return 'New Document';
    case 'document-updated':
      return 'Updated Document';
    case 'document-comments':
      return 'Comments';
    case 'draft-open':
      return 'Draft unfinished';
    case 'review-awaiting':
      return 'Review';
    case 'review-decided':
      return meta.decision === 'rejected' ? 'Rejected suggestion' : 'Merged suggestion';
    default:
      return 'Update';
  }
}

function item(
  partial: Omit<PulseItem, 'href' | 'body'> & { href?: string; body?: string }
): PulseItem {
  return {
    ...partial,
    body: partial.body ?? buildMockBody(partial.kind, partial.meta),
    href: partial.href ?? `/documents/${partial.documentId}`,
  };
}

/** ~28 mixed items; bodies are keyword-first (document title is separate). */
const MOCK_ITEMS: PulseItem[] = [
  item({
    id: 'review-awaiting:mock-rev-1',
    kind: 'review-awaiting',
    title: 'Security guidelines',
    href: '/documents/mock-rev-1?mode=edit&tab=draft',
    occurredAt: hoursAgo(0.5),
    documentId: 'mock-rev-1',
    meta: { scopeName: 'Platform', pendingSuggestionCount: 3 },
  }),
  item({
    id: 'document-comments:mock-cmt-1',
    kind: 'document-comments',
    title: 'Onboarding handbook',
    occurredAt: hoursAgo(1),
    documentId: 'mock-cmt-1',
    meta: { scopeName: 'Platform', contextName: 'Onboarding', commentCount: 5 },
  }),
  item({
    id: 'document-new:mock-new-1',
    kind: 'document-new',
    title: 'Team handbook v1',
    occurredAt: hoursAgo(2),
    documentId: 'mock-new-1',
    meta: { scopeName: 'Platform', contextName: 'Onboarding' },
  }),
  item({
    id: 'document-updated:mock-upd-1',
    kind: 'document-updated',
    title: 'Release process',
    occurredAt: hoursAgo(3),
    documentId: 'mock-upd-1',
    meta: { scopeName: 'Engineering', contextName: 'Delivery' },
  }),
  item({
    id: 'draft-open:mock-draft-1',
    kind: 'draft-open',
    title: 'Q3 planning notes',
    occurredAt: hoursAgo(4),
    documentId: 'mock-draft-1',
    meta: { scopeName: 'Personal' },
  }),
  item({
    id: 'review-decided:mock-dec-1',
    kind: 'review-decided',
    title: 'API style guide',
    occurredAt: hoursAgo(5),
    documentId: 'mock-dec-1',
    meta: { scopeName: 'Platform', decision: 'merged' },
  }),
  item({
    id: 'document-comments:mock-cmt-2',
    kind: 'document-comments',
    title: 'Brand voice',
    occurredAt: hoursAgo(6),
    documentId: 'mock-cmt-2',
    meta: { scopeName: 'Marketing', commentCount: 1 },
  }),
  item({
    id: 'document-new:mock-new-2',
    kind: 'document-new',
    title: 'Vendor checklist',
    occurredAt: hoursAgo(7),
    documentId: 'mock-new-2',
    meta: { scopeName: 'Procurement' },
  }),
  item({
    id: 'document-updated:mock-upd-2',
    kind: 'document-updated',
    title: 'Incident playbook',
    occurredAt: hoursAgo(8),
    documentId: 'mock-upd-2',
    meta: { scopeName: 'Ops', contextName: 'Runbooks' },
  }),
  item({
    id: 'review-awaiting:mock-rev-2',
    kind: 'review-awaiting',
    title: 'Access control policy',
    href: '/documents/mock-rev-2?mode=edit&tab=draft',
    occurredAt: hoursAgo(9),
    documentId: 'mock-rev-2',
    meta: { scopeName: 'Security', pendingSuggestionCount: 1 },
  }),
  item({
    id: 'draft-open:mock-draft-2',
    kind: 'draft-open',
    title: 'Workshop agenda',
    occurredAt: hoursAgo(10),
    documentId: 'mock-draft-2',
    meta: { scopeName: 'Personal' },
  }),
  item({
    id: 'document-comments:mock-cmt-3',
    kind: 'document-comments',
    title: 'Roadmap Q4',
    occurredAt: hoursAgo(11),
    documentId: 'mock-cmt-3',
    meta: { scopeName: 'Platform', contextName: 'Strategy', commentCount: 3 },
  }),
  item({
    id: 'review-decided:mock-dec-2',
    kind: 'review-decided',
    title: 'Naming conventions',
    occurredAt: hoursAgo(13),
    documentId: 'mock-dec-2',
    meta: { scopeName: 'Engineering', decision: 'rejected' },
  }),
  item({
    id: 'document-updated:mock-upd-3',
    kind: 'document-updated',
    title: 'On-call rota',
    occurredAt: hoursAgo(16),
    documentId: 'mock-upd-3',
    meta: { scopeName: 'Ops' },
  }),
  item({
    id: 'document-new:mock-new-3',
    kind: 'document-new',
    title: 'Data retention FAQ',
    occurredAt: hoursAgo(20),
    documentId: 'mock-new-3',
    meta: { scopeName: 'Legal', contextName: 'Compliance' },
  }),
  item({
    id: 'document-comments:mock-cmt-4',
    kind: 'document-comments',
    title: 'Customer success playbook',
    occurredAt: hoursAgo(24),
    documentId: 'mock-cmt-4',
    meta: { scopeName: 'CS', commentCount: 2 },
  }),
  item({
    id: 'draft-open:mock-draft-3',
    kind: 'draft-open',
    title: 'Budget sketch',
    occurredAt: hoursAgo(28),
    documentId: 'mock-draft-3',
    meta: { scopeName: 'Personal' },
  }),
  item({
    id: 'review-awaiting:mock-rev-3',
    kind: 'review-awaiting',
    title: 'Export format spec',
    href: '/documents/mock-rev-3?mode=edit&tab=draft',
    occurredAt: hoursAgo(32),
    documentId: 'mock-rev-3',
    meta: { scopeName: 'Platform', pendingSuggestionCount: 4 },
  }),
  item({
    id: 'document-updated:mock-upd-4',
    kind: 'document-updated',
    title: 'Hiring guide',
    occurredAt: hoursAgo(36),
    documentId: 'mock-upd-4',
    meta: { scopeName: 'People', contextName: 'Hiring' },
  }),
  item({
    id: 'document-new:mock-new-4',
    kind: 'document-new',
    title: 'Office map',
    occurredAt: hoursAgo(40),
    documentId: 'mock-new-4',
    meta: { scopeName: 'Facilities' },
  }),
  item({
    id: 'document-comments:mock-cmt-5',
    kind: 'document-comments',
    title: 'Design tokens',
    occurredAt: hoursAgo(44),
    documentId: 'mock-cmt-5',
    meta: { scopeName: 'Design', commentCount: 7 },
  }),
  item({
    id: 'review-decided:mock-dec-3',
    kind: 'review-decided',
    title: 'Changelog template',
    occurredAt: hoursAgo(48),
    documentId: 'mock-dec-3',
    meta: { scopeName: 'Engineering', decision: 'merged' },
  }),
  item({
    id: 'draft-open:mock-draft-4',
    kind: 'draft-open',
    title: 'Partner brief',
    occurredAt: hoursAgo(52),
    documentId: 'mock-draft-4',
    meta: { scopeName: 'Personal' },
  }),
  item({
    id: 'document-updated:mock-upd-5',
    kind: 'document-updated',
    title: 'VPN setup',
    occurredAt: hoursAgo(56),
    documentId: 'mock-upd-5',
    meta: { scopeName: 'IT', contextName: 'Networking' },
  }),
  item({
    id: 'document-new:mock-new-5',
    kind: 'document-new',
    title: 'Sustainability goals',
    occurredAt: hoursAgo(60),
    documentId: 'mock-new-5',
    meta: { scopeName: 'Company', contextName: 'Strategy' },
  }),
  item({
    id: 'document-comments:mock-cmt-6',
    kind: 'document-comments',
    title: 'Support macros',
    occurredAt: hoursAgo(64),
    documentId: 'mock-cmt-6',
    meta: { scopeName: 'Support', commentCount: 1 },
  }),
  item({
    id: 'review-awaiting:mock-rev-4',
    kind: 'review-awaiting',
    title: 'Billing FAQ',
    href: '/documents/mock-rev-4?mode=edit&tab=draft',
    occurredAt: hoursAgo(72),
    documentId: 'mock-rev-4',
    meta: { scopeName: 'Finance', pendingSuggestionCount: 2 },
  }),
  item({
    id: 'document-updated:mock-upd-6',
    kind: 'document-updated',
    title: 'Welcome mail',
    occurredAt: hoursAgo(80),
    documentId: 'mock-upd-6',
    meta: { scopeName: 'People', contextName: 'Onboarding' },
  }),
];

function buildStats(items: PulseItem[]) {
  const count = (kind: PulseItemKind) => items.filter((i) => i.kind === kind).length;
  const in24h = (kind: PulseItemKind) =>
    items.filter(
      (i) => i.kind === kind && Date.now() - new Date(i.occurredAt).getTime() <= 24 * HOUR
    ).length;
  return {
    openDrafts: count('draft-open'),
    reviewsAwaiting: count('review-awaiting'),
    reviewsDecidedUnread: count('review-decided'),
    newDocuments: count('document-new'),
    updatedDocuments: count('document-updated'),
    comments: count('document-comments'),
    newDocumentsLast24h: in24h('document-new'),
    updatedDocumentsLast24h: in24h('document-updated'),
    commentsLast24h: in24h('document-comments'),
  };
}

export const MOCK_PULSE: MePulseResponse = {
  settings: {
    showDrafts: true,
    showReviews: true,
    showNewDocuments: true,
    showUpdatedDocuments: true,
    showComments: true,
  },
  stats: buildStats(MOCK_ITEMS),
  items: MOCK_ITEMS,
  total: MOCK_ITEMS.length,
  limit: MOCK_ITEMS.length,
  offset: 0,
};

export function filterMockPulse(
  kind: PulseItemKind | null,
  dismissedIds: ReadonlySet<string> = new Set(),
  options?: { limit?: number; offset?: number }
): MePulseResponse {
  const visible = MOCK_PULSE.items.filter((i) => !dismissedIds.has(i.id));
  const filtered = kind ? visible.filter((i) => i.kind === kind) : visible;
  const offset = options?.offset ?? 0;
  const limit = options?.limit ?? filtered.length;
  const items = filtered.slice(offset, offset + limit);
  return {
    ...MOCK_PULSE,
    stats: buildStats(visible),
    items,
    total: filtered.length,
    limit,
    offset,
  };
}
