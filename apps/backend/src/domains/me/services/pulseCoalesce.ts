import type { PulseItemKind } from '../schemas/me.js';

export function buildPulseItemId(kind: PulseItemKind, documentId: string): string {
  return `${kind}:${documentId}`;
}

/** Scope key used as documentId for health-check pulse items: `company|department|team:id`. */
export function buildHealthCheckPulseScopeKey(
  scopeType: 'company' | 'department' | 'team',
  scopeId: string
): string {
  return `${scopeType}:${scopeId}`;
}

export function parsePulseItemId(
  itemId: string
): { kind: PulseItemKind; documentId: string } | null {
  const idx = itemId.indexOf(':');
  if (idx <= 0) return null;
  const kind = itemId.slice(0, idx) as PulseItemKind;
  const documentId = itemId.slice(idx + 1);
  if (!documentId) return null;
  const allowed: PulseItemKind[] = [
    'draft-open',
    'review-awaiting',
    'review-decided',
    'document-new',
    'document-updated',
    'document-comments',
    'health-check-action-needed',
  ];
  if (!allowed.includes(kind)) return null;
  return { kind, documentId };
}

export function parseHealthCheckPulseScopeKey(
  key: string
): { scopeType: 'company' | 'department' | 'team'; scopeId: string } | null {
  const idx = key.indexOf(':');
  if (idx <= 0) return null;
  const scopeType = key.slice(0, idx);
  const scopeId = key.slice(idx + 1);
  if (!scopeId) return null;
  if (scopeType !== 'company' && scopeType !== 'department' && scopeType !== 'team') return null;
  return { scopeType, scopeId };
}

export function payloadRecord(payload: unknown): Record<string, unknown> {
  if (payload != null && typeof payload === 'object' && !Array.isArray(payload)) {
    return payload as Record<string, unknown>;
  }
  return {};
}

export function payloadDocumentId(payload: unknown): string | null {
  const id = payloadRecord(payload).documentId;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

export type PulseNotifRow = {
  id: string;
  event_type: string;
  payload: unknown;
  created_at: Date;
};

/** Keep newest notification per documentId. */
export function coalesceLatestByDocument(rows: PulseNotifRow[]): Map<string, PulseNotifRow> {
  const byDoc = new Map<string, PulseNotifRow>();
  for (const row of rows) {
    const documentId = payloadDocumentId(row.payload);
    if (!documentId) continue;
    const prev = byDoc.get(documentId);
    if (!prev || row.created_at > prev.created_at) {
      byDoc.set(documentId, row);
    }
  }
  return byDoc;
}

/** Group comment notifications: newest row + count per document. */
export function coalesceCommentsByDocument(
  rows: PulseNotifRow[]
): Map<string, { latest: PulseNotifRow; count: number }> {
  const byDoc = new Map<string, { latest: PulseNotifRow; count: number }>();
  for (const row of rows) {
    const documentId = payloadDocumentId(row.payload);
    if (!documentId) continue;
    const prev = byDoc.get(documentId);
    if (!prev) {
      byDoc.set(documentId, { latest: row, count: 1 });
      continue;
    }
    const nextCount = prev.count + 1;
    const latest = row.created_at > prev.latest.created_at ? row : prev.latest;
    byDoc.set(documentId, { latest, count: nextCount });
  }
  return byDoc;
}

function payloadOwnerScopeKey(payload: unknown): string | null {
  const p = payloadRecord(payload);
  const scopeType = p.scopeType;
  const scopeId = p.scopeId;
  if (
    (scopeType === 'company' || scopeType === 'department' || scopeType === 'team') &&
    typeof scopeId === 'string' &&
    scopeId.length > 0
  ) {
    return buildHealthCheckPulseScopeKey(scopeType, scopeId);
  }
  return null;
}

/** Keep newest health-check-action-needed notification per owner scope. */
export function coalesceLatestByOwnerScope(rows: PulseNotifRow[]): Map<string, PulseNotifRow> {
  const byScope = new Map<string, PulseNotifRow>();
  for (const row of rows) {
    const key = payloadOwnerScopeKey(row.payload);
    if (!key) continue;
    const prev = byScope.get(key);
    if (!prev || row.created_at > prev.created_at) {
      byScope.set(key, row);
    }
  }
  return byScope;
}
