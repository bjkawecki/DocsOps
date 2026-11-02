import type { Prisma, PrismaClient } from '../../../../generated/prisma/client.js';
import {
  deriveOutcome,
  deriveReason,
  isActionNeeded,
  isEligible,
  matchesOutcome,
  matchesReason,
  resolveIntervalDays,
  type HealthCheckDocFields,
} from '../../documents/services/healthCheck/healthCheckPolicy.js';
import {
  attentionHintSortRank,
  computeAttentionHint,
} from '../../documents/services/healthCheck/healthCheckAttention.js';
import { getHealthCheckOrgDefaultInterval } from '../../documents/services/healthCheck/healthCheckService.js';
import { materializeHealthCheckFields } from '../../documents/services/healthCheck/healthCheckMaterialize.js';
import {
  computeActionNeededByOwnerScope,
  notifyHealthCheckScopeCountChanges,
} from '../../documents/services/healthCheck/healthCheckNotificationService.js';
import type { HealthCheckOutcome, HealthCheckReason } from '../../documents/schemas/healthCheck.js';
import { canRunHealthCheck } from '../../organisation/permissions/healthCheckPermissions.js';
import {
  getContextIdsForScope,
  type ScopeRef,
} from '../../organisation/permissions/scopeResolution.js';
import { loadActiveUser } from '../../organisation/permissions/userAccessPredicates.js';
import { contextNameFromDoc } from '../routes/meTrashArchive.js';
import type {
  MeHealthCheckItem,
  MeHealthCheckListResponse,
  MeHealthCheckScanResponse,
} from '../schemas/me.js';
import { listHealthCheckFilterScopes, listHealthCheckScopes } from './healthCheckScopes.js';

export class HealthCheckForbiddenError extends Error {
  constructor(message = 'Freshness not allowed') {
    super(message);
    this.name = 'HealthCheckForbiddenError';
  }
}

type OrgScopeFilter = ScopeRef;

function toScopeRefFromFilter(filter: {
  companyId?: string;
  departmentId?: string;
  teamId?: string;
}): OrgScopeFilter | null {
  if (filter.teamId) return { type: 'team', teamId: filter.teamId };
  if (filter.departmentId) return { type: 'department', departmentId: filter.departmentId };
  if (filter.companyId) return { type: 'company', companyId: filter.companyId };
  return null;
}

/**
 * Whether the user may use the health-check hub at all (Lead or KM; never Admin).
 */
export async function userHasHealthCheckCapability(
  prisma: PrismaClient,
  userId: string
): Promise<boolean> {
  const user = await loadActiveUser(prisma, userId);
  if (!user) return false;
  if (user.isAdmin) return false;
  if (user.companyLeads.length > 0) return true;
  if (user.departmentLeads.length > 0) return true;
  if (user.leadOfTeams.length > 0) return true;
  if (!user.isKnowledgeManager) return false;
  return (
    user.knowledgeManagerCompanies.length > 0 ||
    user.knowledgeManagerDepartments.length > 0 ||
    user.knowledgeManagerTeams.length > 0
  );
}

async function resolveAllowedContextIds(
  prisma: PrismaClient,
  userId: string,
  scopeFilter: OrgScopeFilter | null
): Promise<string[]> {
  if (scopeFilter) {
    const allowed = await canRunHealthCheck(prisma, userId, scopeFilter);
    if (!allowed) throw new HealthCheckForbiddenError();
    return getContextIdsForScope(prisma, scopeFilter);
  }

  const scopes = await listHealthCheckScopes(prisma, userId);
  if (scopes.length === 0) return [];

  const idSets = await Promise.all(scopes.map((s) => getContextIdsForScope(prisma, s)));
  return [...new Set(idSets.flat())];
}

const healthCheckDocSelect = {
  id: true,
  title: true,
  contextId: true,
  publishedAt: true,
  archivedAt: true,
  deletedAt: true,
  viewCount: true,
  healthCheckIntervalDays: true,
  healthCheckNextAt: true,
  healthCheckNeedsUpdate: true,
  healthCheckNeedsArchive: true,
  healthCheckSnoozedUntil: true,
  healthCheckLastDecision: true,
  healthCheckLastDecisionAt: true,
  healthCheckLastDecisionById: true,
  context: {
    select: {
      displayName: true,
      ownerDisplayName: true,
      process: { select: { name: true } },
      project: { select: { name: true } },
      subcontext: { select: { name: true } },
    },
  },
} satisfies Prisma.DocumentSelect;

type HealthCheckDocRow = Prisma.DocumentGetPayload<{ select: typeof healthCheckDocSelect }>;

function asPolicyFields(doc: HealthCheckDocRow): HealthCheckDocFields {
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

function actionNeededWhere(now: Date): Prisma.DocumentWhereInput {
  return {
    OR: [
      { healthCheckNeedsUpdate: true },
      { healthCheckNeedsArchive: true },
      { healthCheckSnoozedUntil: { lte: now } },
      {
        AND: [{ healthCheckSnoozedUntil: null }, { healthCheckNextAt: { lte: now } }],
      },
    ],
  };
}

function toListItem(
  doc: HealthCheckDocRow,
  now: Date,
  orgDefault: Awaited<ReturnType<typeof getHealthCheckOrgDefaultInterval>>
): MeHealthCheckItem {
  const fields = asPolicyFields(doc);
  const intervalDays = resolveIntervalDays(fields, {
    healthCheckDefaultIntervalDays: orgDefault,
  });
  const attentionHint = computeAttentionHint({
    viewCount: doc.viewCount,
    publishedAt: doc.publishedAt,
    intervalDays,
    now,
  });
  return {
    documentId: doc.id,
    title: doc.title,
    reason: deriveReason(fields, now),
    outcome: deriveOutcome(fields, now),
    healthCheckNextAt: doc.healthCheckNextAt?.toISOString() ?? null,
    healthCheckNeedsUpdate: doc.healthCheckNeedsUpdate,
    healthCheckNeedsArchive: doc.healthCheckNeedsArchive,
    healthCheckSnoozedUntil: doc.healthCheckSnoozedUntil?.toISOString() ?? null,
    healthCheckLastDecision: doc.healthCheckLastDecision,
    healthCheckLastDecisionAt: doc.healthCheckLastDecisionAt?.toISOString() ?? null,
    healthCheckLastDecisionById: doc.healthCheckLastDecisionById,
    contextId: doc.contextId!,
    contextName: contextNameFromDoc(doc),
    ownerScopeLabel: doc.context?.ownerDisplayName ?? null,
    attentionHint,
  };
}

function outcomeSortRank(outcome: MeHealthCheckItem['outcome']): number {
  if (outcome === 'needs_update') return 0;
  if (outcome === 'archive') return 1;
  return 2;
}

function compareHubItems(a: MeHealthCheckItem, b: MeHealthCheckItem): number {
  const outA = outcomeSortRank(a.outcome);
  const outB = outcomeSortRank(b.outcome);
  if (outA !== outB) return outA - outB;

  const attA = attentionHintSortRank(a.attentionHint);
  const attB = attentionHintSortRank(b.attentionHint);
  if (attA !== attB) return attA - attB;

  const nextA = a.healthCheckNextAt ?? '';
  const nextB = b.healthCheckNextAt ?? '';
  if (nextA !== nextB) return nextA < nextB ? -1 : 1;

  return a.title.localeCompare(b.title);
}

export async function listHealthCheckActionNeeded(
  prisma: PrismaClient,
  userId: string,
  opts: {
    reason: HealthCheckReason;
    outcome: HealthCheckOutcome;
    scopeFilter: OrgScopeFilter | null;
    limit: number;
    offset: number;
    now?: Date;
  }
): Promise<MeHealthCheckListResponse> {
  const capable = await userHasHealthCheckCapability(prisma, userId);
  if (!capable) throw new HealthCheckForbiddenError();

  const now = opts.now ?? new Date();
  const scopes = await listHealthCheckFilterScopes(prisma, userId);
  const contextIds = await resolveAllowedContextIds(prisma, userId, opts.scopeFilter);
  if (contextIds.length === 0) {
    return { items: [], total: 0, limit: opts.limit, offset: opts.offset, scopes };
  }

  const orgDefault = await getHealthCheckOrgDefaultInterval(prisma);

  const candidates = await prisma.document.findMany({
    where: {
      publishedAt: { not: null },
      archivedAt: null,
      deletedAt: null,
      contextId: { in: contextIds },
      ...actionNeededWhere(now),
    },
    select: healthCheckDocSelect,
  });

  const filtered = candidates.filter((doc) => {
    const fields = asPolicyFields(doc);
    if (!isEligible(fields) || !isActionNeeded(fields, now)) return false;
    return matchesReason(fields, opts.reason, now) && matchesOutcome(fields, opts.outcome, now);
  });

  const items = filtered.map((d) => toListItem(d, now, orgDefault)).sort(compareHubItems);
  const total = items.length;
  const page = items.slice(opts.offset, opts.offset + opts.limit);
  return {
    items: page,
    total,
    limit: opts.limit,
    offset: opts.offset,
    scopes,
  };
}

export async function scanHealthCheckSubtree(
  prisma: PrismaClient,
  userId: string,
  scopeFilter: OrgScopeFilter | null,
  now: Date = new Date()
): Promise<MeHealthCheckScanResponse> {
  const capable = await userHasHealthCheckCapability(prisma, userId);
  if (!capable) throw new HealthCheckForbiddenError();

  const contextIds = await resolveAllowedContextIds(prisma, userId, scopeFilter);
  if (contextIds.length === 0) {
    return {
      scanned: 0,
      updatedDocumentIds: [],
      counts: { actionNeeded: 0, due: 0, open: 0, needsUpdate: 0, archive: 0 },
    };
  }

  const orgDefault = await getHealthCheckOrgDefaultInterval(prisma);

  const docs = await prisma.document.findMany({
    where: {
      publishedAt: { not: null },
      archivedAt: null,
      deletedAt: null,
      contextId: { in: contextIds },
    },
    select: healthCheckDocSelect,
  });

  const beforeCounts = await computeActionNeededByOwnerScope(prisma, contextIds, now);

  const updatedDocumentIds = await materializeHealthCheckFields(
    prisma,
    docs.map((doc) => ({ id: doc.id, ...asPolicyFields(doc) })),
    orgDefault,
    now
  );

  // Re-load for accurate counts after materialization
  const refreshed = await prisma.document.findMany({
    where: {
      publishedAt: { not: null },
      archivedAt: null,
      deletedAt: null,
      contextId: { in: contextIds },
    },
    select: healthCheckDocSelect,
  });

  let actionNeeded = 0;
  let due = 0;
  let open = 0;
  let needsUpdate = 0;
  let archive = 0;
  for (const doc of refreshed) {
    const fields = asPolicyFields(doc);
    if (!isEligible(fields) || !isActionNeeded(fields, now)) continue;
    actionNeeded += 1;
    if (matchesReason(fields, 'due', now)) due += 1;
    if (matchesOutcome(fields, 'open', now)) open += 1;
    if (matchesOutcome(fields, 'needs_update', now)) needsUpdate += 1;
    if (matchesOutcome(fields, 'archive', now)) archive += 1;
  }

  const afterCounts = await computeActionNeededByOwnerScope(prisma, contextIds, now);
  try {
    await notifyHealthCheckScopeCountChanges({
      prisma,
      before: beforeCounts,
      after: afterCounts,
      actorUserId: userId,
    });
  } catch {
    // Notification failures must not fail the scan response.
  }

  return {
    scanned: docs.length,
    updatedDocumentIds,
    counts: { actionNeeded, due, open, needsUpdate, archive },
  };
}

export { toScopeRefFromFilter };
export { listHealthCheckScopes, listHealthCheckFilterScopes } from './healthCheckScopes.js';
