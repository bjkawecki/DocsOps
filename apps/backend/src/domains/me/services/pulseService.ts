import type { PrismaClient } from '../../../../generated/prisma/client.js';
import { purgeUnreadableDocumentNotifications } from '../../notifications/services/notificationInboxAccess.js';
import type { PulseItemKind, MePulseQuery } from '../schemas/me.js';
import { listMeReviews } from './meReviewsService.js';
import { getScopeFromOwner, ownerScopeSelect } from '../routes/me/route-helpers.js';
import {
  buildPulseItemId,
  coalesceCommentsByDocument,
  coalesceLatestByDocument,
} from './pulseCoalesce.js';
import { buildHealthCheckPulseItems } from './pulseHealthCheck.js';
import {
  loadUnreadNotifications,
  PULSE_COMMENT_EVENT_TYPES,
  PULSE_DECIDED_EVENT_TYPES,
  PULSE_HEALTH_CHECK_EVENT_TYPES,
  PULSE_NEW_EVENT_TYPES,
  PULSE_UPDATED_EVENT_TYPES,
} from './pulseNotifLoad.js';
import {
  formatPulseContextType,
  loadPulseDocumentMeta,
  pulseDocMetaOrFallback,
  type PulseDocMeta,
  type PulseScopeType,
} from './pulseDocumentMeta.js';
import { resolvePulseSettings, type PulseSettings } from './pulseSettings.js';
import { buildPulseBody } from './pulseTemplates.js';

export type { PulseSettings } from './pulseSettings.js';
export { resolvePulseSettings } from './pulseSettings.js';
export { buildPulseBody } from './pulseTemplates.js';
export {
  buildPulseItemId,
  buildHealthCheckPulseScopeKey,
  coalesceCommentsByDocument,
  coalesceLatestByDocument,
  coalesceLatestByOwnerScope,
  parseHealthCheckPulseScopeKey,
  parsePulseItemId,
} from './pulseCoalesce.js';
export { markPulseItemRead } from './pulseMarkRead.js';
export type { MarkPulseItemReadResult } from './pulseMarkRead.js';
const MS_24H = 24 * 60 * 60 * 1000;

export type PulseStats = {
  openDrafts: number;
  reviewsAwaiting: number;
  reviewsDecidedUnread: number;
  newDocuments: number;
  updatedDocuments: number;
  comments: number;
  healthCheckActionNeeded: number;
  newDocumentsLast24h: number;
  updatedDocumentsLast24h: number;
  commentsLast24h: number;
  healthCheckActionNeededLast24h: number;
};

export type PulseItemMeta = {
  scopeType?: PulseScopeType;
  scopeName?: string;
  contextName?: string;
  commentCount?: number;
  pendingSuggestionCount?: number;
  decision?: 'merged' | 'rejected';
  count?: number;
};

export type PulseItem = {
  id: string;
  kind: PulseItemKind;
  title: string;
  body: string;
  href: string;
  occurredAt: string;
  documentId: string;
  meta: PulseItemMeta;
};

function locationMeta(
  scopeType: PulseScopeType,
  scopeName: string,
  contextName: string | null | undefined,
  extra?: Omit<PulseItemMeta, 'scopeType' | 'scopeName' | 'contextName'>
): PulseItemMeta {
  return { scopeType, scopeName, ...(contextName ? { contextName } : {}), ...extra };
}

function locationMetaFromDoc(
  meta: PulseDocMeta,
  extra?: Omit<PulseItemMeta, 'scopeType' | 'scopeName' | 'contextName'>
): PulseItemMeta {
  return locationMeta(meta.scopeType, meta.scopeName, meta.contextName, extra);
}

export type PulseResponse = {
  stats: PulseStats;
  items: PulseItem[];
  settings: PulseSettings;
  /** Total items matching filter (before limit/offset). */
  total: number;
  limit: number;
  offset: number;
};

function inLast24h(iso: string, now: Date): boolean {
  return now.getTime() - new Date(iso).getTime() <= MS_24H;
}

function emptyStats(): PulseStats {
  return {
    openDrafts: 0,
    reviewsAwaiting: 0,
    reviewsDecidedUnread: 0,
    newDocuments: 0,
    updatedDocuments: 0,
    comments: 0,
    healthCheckActionNeeded: 0,
    newDocumentsLast24h: 0,
    updatedDocumentsLast24h: 0,
    commentsLast24h: 0,
    healthCheckActionNeededLast24h: 0,
  };
}

/**
 * Aggregated Home Pulse: open drafts/reviews + unread activity (deduped per document).
 */
export async function getMePulse(
  prisma: PrismaClient,
  userId: string,
  preferences: unknown,
  query: MePulseQuery
): Promise<PulseResponse> {
  const settings = resolvePulseSettings(
    preferences != null && typeof preferences === 'object'
      ? (preferences as { pulseSettings?: unknown }).pulseSettings
      : undefined
  );
  const now = new Date();
  const items: PulseItem[] = [];
  const stats = emptyStats();

  await purgeUnreadableDocumentNotifications(prisma, userId);

  const [newRows, updatedRows, commentRows, decidedRows, healthCheckRows, draftDocs, reviews] =
    await Promise.all([
      settings.showNewDocuments
        ? loadUnreadNotifications(prisma, userId, PULSE_NEW_EVENT_TYPES)
        : Promise.resolve([]),
      settings.showUpdatedDocuments
        ? loadUnreadNotifications(prisma, userId, PULSE_UPDATED_EVENT_TYPES)
        : Promise.resolve([]),
      settings.showComments
        ? loadUnreadNotifications(prisma, userId, PULSE_COMMENT_EVENT_TYPES)
        : Promise.resolve([]),
      settings.showReviews
        ? loadUnreadNotifications(prisma, userId, PULSE_DECIDED_EVENT_TYPES)
        : Promise.resolve([]),
      settings.showHealthCheck
        ? loadUnreadNotifications(prisma, userId, PULSE_HEALTH_CHECK_EVENT_TYPES)
        : Promise.resolve([]),
      settings.showDrafts
        ? prisma.document.findMany({
            where: {
              createdById: userId,
              publishedAt: null,
              deletedAt: null,
              archivedAt: null,
            },
            select: {
              id: true,
              title: true,
              updatedAt: true,
              context: {
                select: {
                  displayName: true,
                  contextType: true,
                  process: { select: { owner: { select: ownerScopeSelect } } },
                  project: { select: { owner: { select: ownerScopeSelect } } },
                  subcontext: {
                    select: { project: { select: { owner: { select: ownerScopeSelect } } } },
                  },
                },
              },
            },
            orderBy: { updatedAt: 'desc' },
            take: 40,
          })
        : Promise.resolve([]),
      settings.showReviews
        ? listMeReviews(prisma, userId, { limit: 40, offset: 0 })
        : Promise.resolve({
            pendingForReview: [],
            totalPendingForReview: 0,
            limit: 40,
            offset: 0,
          }),
    ]);

  const newByDoc = coalesceLatestByDocument(newRows);
  const updatedByDoc = coalesceLatestByDocument(updatedRows);
  const commentsByDoc = coalesceCommentsByDocument(commentRows);
  const decidedByDoc = coalesceLatestByDocument(decidedRows);

  const metaById = await loadPulseDocumentMeta(prisma, [
    ...newByDoc.keys(),
    ...updatedByDoc.keys(),
    ...commentsByDoc.keys(),
    ...decidedByDoc.keys(),
    ...draftDocs.map((d) => d.id),
    ...reviews.pendingForReview.map((r) => r.documentId),
  ]);

  if (settings.showDrafts) {
    stats.openDrafts = draftDocs.length;
    for (const doc of draftDocs) {
      const owner =
        doc.context?.process?.owner ??
        doc.context?.project?.owner ??
        doc.context?.subcontext?.project?.owner ??
        null;
      const scope = getScopeFromOwner(owner);
      const contextName = doc.context?.displayName?.trim() || null;
      const contextTypeLabel = formatPulseContextType(doc.context?.contextType ?? null);
      const occurredAt = doc.updatedAt.toISOString();
      items.push({
        id: buildPulseItemId('draft-open', doc.id),
        kind: 'draft-open',
        title: doc.title,
        body: buildPulseBody({
          kind: 'draft-open',
          title: doc.title,
          scopeName: scope.scopeName,
          contextName,
          contextTypeLabel,
        }),
        href: `/documents/${doc.id}`,
        occurredAt,
        documentId: doc.id,
        meta: locationMeta(scope.scopeType, scope.scopeName, contextName),
      });
    }
  }

  if (settings.showReviews) {
    stats.reviewsAwaiting = reviews.totalPendingForReview;
    for (const r of reviews.pendingForReview) {
      const occurredAt = r.lastSuggestionAt ?? new Date(0).toISOString();
      items.push({
        id: buildPulseItemId('review-awaiting', r.documentId),
        kind: 'review-awaiting',
        title: r.documentTitle,
        body: buildPulseBody({
          kind: 'review-awaiting',
          title: r.documentTitle,
          scopeName: r.scopeName,
          contextName: null,
          contextTypeLabel: null,
          pendingSuggestionCount: r.pendingSuggestionCount,
        }),
        href: `/documents/${r.documentId}?mode=edit&tab=draft`,
        occurredAt,
        documentId: r.documentId,
        meta: locationMeta(r.scopeType, r.scopeName, null, {
          pendingSuggestionCount: r.pendingSuggestionCount,
        }),
      });
    }

    stats.reviewsDecidedUnread = decidedByDoc.size;
    for (const [documentId, row] of decidedByDoc) {
      const meta = pulseDocMetaOrFallback(metaById, documentId);
      const decision = row.event_type === 'draft-request-rejected' ? 'rejected' : 'merged';
      const occurredAt = row.created_at.toISOString();
      items.push({
        id: buildPulseItemId('review-decided', documentId),
        kind: 'review-decided',
        title: meta.title,
        body: buildPulseBody({
          kind: 'review-decided',
          title: meta.title,
          scopeName: meta.scopeName,
          contextName: meta.contextName,
          contextTypeLabel: meta.contextTypeLabel,
          decision,
        }),
        href: `/documents/${documentId}`,
        occurredAt,
        documentId,
        meta: locationMetaFromDoc(meta, { decision }),
      });
    }
  }

  if (settings.showNewDocuments) {
    stats.newDocuments = newByDoc.size;
    for (const [documentId, row] of newByDoc) {
      const meta = pulseDocMetaOrFallback(metaById, documentId);
      const occurredAt = row.created_at.toISOString();
      if (inLast24h(occurredAt, now)) stats.newDocumentsLast24h += 1;
      items.push({
        id: buildPulseItemId('document-new', documentId),
        kind: 'document-new',
        title: meta.title,
        body: buildPulseBody({
          kind: 'document-new',
          title: meta.title,
          scopeName: meta.scopeName,
          contextName: meta.contextName,
          contextTypeLabel: meta.contextTypeLabel,
        }),
        href: `/documents/${documentId}`,
        occurredAt,
        documentId,
        meta: locationMetaFromDoc(meta),
      });
    }
  }

  if (settings.showUpdatedDocuments) {
    stats.updatedDocuments = updatedByDoc.size;
    for (const [documentId, row] of updatedByDoc) {
      const meta = pulseDocMetaOrFallback(metaById, documentId);
      const occurredAt = row.created_at.toISOString();
      if (inLast24h(occurredAt, now)) stats.updatedDocumentsLast24h += 1;
      items.push({
        id: buildPulseItemId('document-updated', documentId),
        kind: 'document-updated',
        title: meta.title,
        body: buildPulseBody({
          kind: 'document-updated',
          title: meta.title,
          scopeName: meta.scopeName,
          contextName: meta.contextName,
          contextTypeLabel: meta.contextTypeLabel,
        }),
        href: `/documents/${documentId}`,
        occurredAt,
        documentId,
        meta: locationMetaFromDoc(meta),
      });
    }
  }

  if (settings.showComments) {
    stats.comments = commentsByDoc.size;
    for (const [documentId, group] of commentsByDoc) {
      const meta = pulseDocMetaOrFallback(metaById, documentId);
      const occurredAt = group.latest.created_at.toISOString();
      if (inLast24h(occurredAt, now)) stats.commentsLast24h += 1;
      items.push({
        id: buildPulseItemId('document-comments', documentId),
        kind: 'document-comments',
        title: meta.title,
        body: buildPulseBody({
          kind: 'document-comments',
          title: meta.title,
          scopeName: meta.scopeName,
          contextName: meta.contextName,
          contextTypeLabel: meta.contextTypeLabel,
          commentCount: group.count,
        }),
        href: `/documents/${documentId}`,
        occurredAt,
        documentId,
        meta: locationMetaFromDoc(meta, { commentCount: group.count }),
      });
    }
  }

  if (settings.showHealthCheck) {
    const hc = await buildHealthCheckPulseItems({
      prisma,
      rows: healthCheckRows,
      now,
      inLast24h,
    });
    stats.healthCheckActionNeeded = hc.healthCheckActionNeeded;
    stats.healthCheckActionNeededLast24h = hc.healthCheckActionNeededLast24h;
    items.push(...hc.items);
  }

  items.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  const filtered = query.kind ? items.filter((i) => i.kind === query.kind) : items;
  const total = filtered.length;
  const page = filtered.slice(query.offset, query.offset + query.limit);

  return {
    stats,
    items: page,
    settings,
    total,
    limit: query.limit,
    offset: query.offset,
  };
}
