import type { PulseItemKind } from '../schemas/me.js';

export function buildPulseItemId(kind: PulseItemKind, documentId: string): string {
  return `${kind}:${documentId}`;
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
  ];
  if (!allowed.includes(kind)) return null;
  return { kind, documentId };
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
