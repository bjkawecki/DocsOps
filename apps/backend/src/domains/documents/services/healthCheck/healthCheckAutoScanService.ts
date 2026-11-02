import type { PrismaClient } from '../../../../../generated/prisma/client.js';
import {
  contextWithOwnerInclude,
  ownerFromContextRow,
  ownerScopeFromOwnerRow,
  toScopeRef,
} from '../../../organisation/permissions/ownerScope.js';
import {
  isActionNeeded,
  isEligible,
  matchesOutcome,
  matchesReason,
  type HealthCheckDocFields,
} from './healthCheckPolicy.js';
import { getHealthCheckOrgDefaultInterval } from './healthCheckService.js';
import { materializeHealthCheckFields } from './healthCheckMaterialize.js';
import {
  computeActionNeededByOwnerScope,
  notifyHealthCheckScopeCountChanges,
} from './healthCheckNotificationService.js';

export type OrgHealthCheckAutoScanResult = {
  scanned: number;
  updatedDocumentIds: string[];
  skippedPersonal: number;
  counts: {
    actionNeeded: number;
    due: number;
    open: number;
    needsUpdate: number;
    archive: number;
  };
};

const AUTO_SCAN_DOC_SELECT = {
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
  context: { include: contextWithOwnerInclude },
} as const;

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

function isNonPersonalOrgDoc(doc: {
  context: Parameters<typeof ownerFromContextRow>[0] | null;
}): boolean {
  if (!doc.context) return false;
  const ownerRow = ownerFromContextRow(doc.context);
  const owner = ownerScopeFromOwnerRow(ownerRow);
  if (owner.ownerUserId != null) return false;
  return toScopeRef(owner) != null;
}

/**
 * Platform auto-scan: materialize all non-personal published docs and notify
 * leads when action_needed counts change (Phase 4).
 */
export async function runOrgHealthCheckAutoScan(
  prisma: PrismaClient,
  now: Date = new Date()
): Promise<OrgHealthCheckAutoScanResult> {
  const orgDefault = await getHealthCheckOrgDefaultInterval(prisma);

  const allDocs = await prisma.document.findMany({
    where: {
      publishedAt: { not: null },
      archivedAt: null,
      deletedAt: null,
      contextId: { not: null },
    },
    select: AUTO_SCAN_DOC_SELECT,
  });

  const orgDocs = allDocs.filter(isNonPersonalOrgDoc);
  const skippedPersonal = allDocs.length - orgDocs.length;
  const contextIds = [
    ...new Set(
      orgDocs.map((d) => d.contextId).filter((id): id is string => id != null && id !== '')
    ),
  ];

  if (contextIds.length === 0) {
    return {
      scanned: 0,
      updatedDocumentIds: [],
      skippedPersonal,
      counts: { actionNeeded: 0, due: 0, open: 0, needsUpdate: 0, archive: 0 },
    };
  }

  const beforeCounts = await computeActionNeededByOwnerScope(prisma, contextIds, now);

  const updatedDocumentIds = await materializeHealthCheckFields(
    prisma,
    orgDocs.map((doc) => ({ id: doc.id, ...asPolicyFields(doc) })),
    orgDefault,
    now
  );

  const refreshed = await prisma.document.findMany({
    where: {
      id: { in: orgDocs.map((d) => d.id) },
      publishedAt: { not: null },
      archivedAt: null,
      deletedAt: null,
    },
    select: AUTO_SCAN_DOC_SELECT,
  });

  let actionNeeded = 0;
  let due = 0;
  let open = 0;
  let needsUpdate = 0;
  let archive = 0;
  for (const doc of refreshed) {
    if (!isNonPersonalOrgDoc(doc)) continue;
    const fields = asPolicyFields(doc);
    if (!isEligible(fields) || !isActionNeeded(fields, now)) continue;
    actionNeeded += 1;
    if (matchesReason(fields, 'due', now)) due += 1;
    if (matchesOutcome(fields, 'open', now)) open += 1;
    if (matchesOutcome(fields, 'needs_update', now)) needsUpdate += 1;
    if (matchesOutcome(fields, 'archive', now)) archive += 1;
  }

  const afterCounts = await computeActionNeededByOwnerScope(prisma, contextIds, now);
  await notifyHealthCheckScopeCountChanges({
    prisma,
    before: beforeCounts,
    after: afterCounts,
    actorUserId: null,
  });

  return {
    scanned: orgDocs.length,
    updatedDocumentIds,
    skippedPersonal,
    counts: { actionNeeded, due, open, needsUpdate, archive },
  };
}

/** Whether platform auto-scan is enabled in SystemSettings. */
export async function isHealthCheckAutoScanEnabled(prisma: PrismaClient): Promise<boolean> {
  const row = await prisma.systemSettings.findUnique({
    where: { id: 'default' },
    select: { healthCheckAutoScanEnabled: true },
  });
  return row?.healthCheckAutoScanEnabled === true;
}
