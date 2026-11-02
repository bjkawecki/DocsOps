import type { Prisma, PrismaClient } from '../../../../../generated/prisma/client.js';
import { enqueueNotificationEvent } from '../../../notifications/services/notificationEnqueueService.js';
import {
  listHealthCheckLeadUserIdsForOwnerScope,
  listHealthCheckNeedsUpdateRecipientIds,
  resolveDocumentHealthCheckOwnerScope,
  scopeRefKey,
  scopeRefToPayload,
} from '../../../notifications/services/healthCheckNotificationRecipients.js';
import {
  contextWithOwnerInclude,
  ownerFromContextRow,
  ownerScopeFromOwnerRow,
  toScopeRef,
} from '../../../organisation/permissions/ownerScope.js';
import type { ScopeRef } from '../../../organisation/permissions/scopeResolution.js';
import { getContextIdsForScope } from '../../../organisation/permissions/scopeResolution.js';
import { isActionNeeded, isEligible, type HealthCheckDocFields } from './healthCheckPolicy.js';

type PrismaDb = PrismaClient;

const HEALTH_FIELDS_SELECT = {
  id: true,
  publishedAt: true,
  archivedAt: true,
  deletedAt: true,
  contextId: true,
  healthCheckIntervalDays: true,
  healthCheckNextAt: true,
  healthCheckNeedsUpdate: true,
  healthCheckNeedsArchive: true,
  healthCheckSnoozedUntil: true,
  title: true,
  context: { include: contextWithOwnerInclude },
} satisfies Prisma.DocumentSelect;

export type HealthCheckScopeCountMap = Map<string, { scope: ScopeRef; count: number }>;

function asPolicyFields(doc: {
  publishedAt: Date | null;
  archivedAt: Date | null;
  deletedAt: Date | null;
  contextId: string | null;
  healthCheckIntervalDays: number | null;
  healthCheckNextAt: Date | null;
  healthCheckNeedsUpdate: boolean;
  healthCheckNeedsArchive: boolean;
  healthCheckSnoozedUntil: Date | null;
}): HealthCheckDocFields {
  return {
    publishedAt: doc.publishedAt,
    archivedAt: doc.archivedAt,
    deletedAt: doc.deletedAt,
    contextId: doc.contextId,
    healthCheckIntervalDays: doc.healthCheckIntervalDays,
    healthCheckNextAt: doc.healthCheckNextAt,
    healthCheckNeedsUpdate: doc.healthCheckNeedsUpdate,
    healthCheckNeedsArchive: doc.healthCheckNeedsArchive,
    healthCheckSnoozedUntil: doc.healthCheckSnoozedUntil,
  };
}

function ownerScopeFromDoc(doc: {
  context: Parameters<typeof ownerFromContextRow>[0] | null;
}): ScopeRef | null {
  if (!doc.context) return null;
  const ownerRow = ownerFromContextRow(doc.context);
  const owner = ownerScopeFromOwnerRow(ownerRow);
  if (owner.ownerUserId != null) return null;
  return toScopeRef(owner);
}

/** Counts action_needed documents per owner scope within the given context ids. */
export async function computeActionNeededByOwnerScope(
  prisma: PrismaDb,
  contextIds: string[],
  now: Date = new Date()
): Promise<HealthCheckScopeCountMap> {
  const result: HealthCheckScopeCountMap = new Map();
  if (contextIds.length === 0) return result;

  const docs = await prisma.document.findMany({
    where: {
      publishedAt: { not: null },
      archivedAt: null,
      deletedAt: null,
      contextId: { in: contextIds },
    },
    select: HEALTH_FIELDS_SELECT,
  });

  for (const doc of docs) {
    const fields = asPolicyFields(doc);
    if (!isEligible(fields) || !isActionNeeded(fields, now)) continue;
    const scope = ownerScopeFromDoc(doc);
    if (!scope) continue;
    const key = scopeRefKey(scope);
    const prev = result.get(key);
    if (prev) {
      prev.count += 1;
    } else {
      result.set(key, { scope, count: 1 });
    }
  }
  return result;
}

/** Count action_needed docs for one owner scope. */
export async function countActionNeededForOwnerScope(
  prisma: PrismaDb,
  scope: ScopeRef,
  now: Date = new Date()
): Promise<number> {
  const contextIds = await getContextIdsForScope(prisma, scope);
  const map = await computeActionNeededByOwnerScope(prisma, contextIds, now);
  return map.get(scopeRefKey(scope))?.count ?? 0;
}

/**
 * Notify leads for each owner scope whose action_needed count changed.
 * Payload carries the new absolute Ist-Zahl.
 */
export async function notifyHealthCheckScopeCountChanges(args: {
  prisma: PrismaDb;
  before: HealthCheckScopeCountMap;
  after: HealthCheckScopeCountMap;
  actorUserId?: string | null;
}): Promise<void> {
  const keys = new Set([...args.before.keys(), ...args.after.keys()]);
  for (const key of keys) {
    const beforeCount = args.before.get(key)?.count ?? 0;
    const afterEntry = args.after.get(key);
    const afterCount = afterEntry?.count ?? 0;
    if (beforeCount === afterCount) continue;
    const scope = afterEntry?.scope ?? args.before.get(key)?.scope;
    if (!scope) continue;

    let targets = await listHealthCheckLeadUserIdsForOwnerScope(args.prisma, scope);
    if (args.actorUserId) {
      targets = targets.filter((id) => id !== args.actorUserId);
    }
    if (targets.length === 0) continue;

    const payload = {
      ...scopeRefToPayload(scope),
      count: afterCount,
      kind: 'action_needed' as const,
    };
    await enqueueNotificationEvent({
      eventType: 'health-check-action-needed',
      targetUserIds: targets,
      payload,
    });
  }
}

/** Writer/author ping when a document is marked needs_update. */
export async function notifyHealthCheckNeedsUpdate(
  prisma: PrismaDb,
  documentId: string,
  actorUserId: string
): Promise<void> {
  const targets = await listHealthCheckNeedsUpdateRecipientIds(prisma, documentId, actorUserId);
  if (targets.length === 0) return;

  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: { title: true },
  });

  await enqueueNotificationEvent({
    eventType: 'health-check-needs-update',
    targetUserIds: targets,
    payload: {
      documentId,
      documentTitle: doc?.title ?? null,
    },
  });
}

/**
 * After a single-document health decision or publish reset:
 * compare scope Ist-Zahl before/after and notify leads if changed.
 */
export async function notifyHealthCheckAfterDocumentChange(args: {
  prisma: PrismaDb;
  documentId: string;
  beforeCount: number;
  actorUserId?: string | null;
  now?: Date;
}): Promise<void> {
  const scope = await resolveDocumentHealthCheckOwnerScope(args.prisma, args.documentId);
  if (!scope) return;
  const now = args.now ?? new Date();
  const afterCount = await countActionNeededForOwnerScope(args.prisma, scope, now);
  if (afterCount === args.beforeCount) return;

  const before: HealthCheckScopeCountMap = new Map();
  const after: HealthCheckScopeCountMap = new Map();
  const key = scopeRefKey(scope);
  before.set(key, { scope, count: args.beforeCount });
  after.set(key, { scope, count: afterCount });
  await notifyHealthCheckScopeCountChanges({
    prisma: args.prisma,
    before,
    after,
    actorUserId: args.actorUserId,
  });
}

/** Snapshot Ist-Zahl for the document's owner scope (0 if no Do11y scope). */
export async function snapshotHealthCheckScopeCount(
  prisma: PrismaDb,
  documentId: string,
  now: Date = new Date()
): Promise<{ scope: ScopeRef | null; count: number }> {
  const scope = await resolveDocumentHealthCheckOwnerScope(prisma, documentId);
  if (!scope) return { scope: null, count: 0 };
  const count = await countActionNeededForOwnerScope(prisma, scope, now);
  return { scope, count };
}

/** Safe wrapper: log failures, never throw into request handlers. */
export async function notifyHealthCheckSafe(
  log: { warn: (meta: Record<string, unknown>, msg: string) => void },
  meta: Record<string, unknown>,
  fn: () => Promise<void>
): Promise<void> {
  try {
    await fn();
  } catch (error) {
    log.warn({ error, ...meta }, 'Failed to enqueue health-check notification');
  }
}
