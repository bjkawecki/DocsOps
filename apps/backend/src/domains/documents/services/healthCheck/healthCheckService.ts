import type { Prisma, PrismaClient } from '../../../../../generated/prisma/client.js';
import {
  isHealthCheckIntervalDays,
  type HealthCheckIntervalDays,
} from '../../schemas/healthCheck.js';
import { addDays, resolveIntervalDays, type HealthCheckDocFields } from './healthCheckPolicy.js';

type PrismaDb = PrismaClient | Prisma.TransactionClient;

export class HealthCheckSettingsNotConfiguredError extends Error {
  constructor(message = 'SystemSettings health check default interval is not configured') {
    super(message);
    this.name = 'HealthCheckSettingsNotConfiguredError';
  }
}

export class HealthCheckDocumentNotFoundError extends Error {
  constructor(documentId: string) {
    super(`Document not found: ${documentId}`);
    this.name = 'HealthCheckDocumentNotFoundError';
  }
}

const DOC_SELECT = {
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
  healthCheckLastDecision: true,
  healthCheckLastDecisionAt: true,
} as const;

/** Schema / migration default when the singleton row has not been written yet. */
const SCHEMA_DEFAULT_INTERVAL_DAYS: HealthCheckIntervalDays = 90;

async function loadOrgDefaultInterval(prisma: PrismaDb): Promise<HealthCheckIntervalDays> {
  const settings = await prisma.systemSettings.findUnique({
    where: { id: 'default' },
    select: { healthCheckDefaultIntervalDays: true },
  });
  if (!settings) {
    return SCHEMA_DEFAULT_INTERVAL_DAYS;
  }
  if (!isHealthCheckIntervalDays(settings.healthCheckDefaultIntervalDays)) {
    throw new HealthCheckSettingsNotConfiguredError(
      `Invalid healthCheckDefaultIntervalDays: ${settings.healthCheckDefaultIntervalDays}`
    );
  }
  return settings.healthCheckDefaultIntervalDays;
}

async function appendEvent(
  prisma: PrismaDb,
  data: {
    documentId: string;
    actorUserId: string | null;
    decision: string;
    nextAt: Date | null;
    snoozedUntil: Date | null;
    intervalDays: number | null;
    note?: string | null;
  }
): Promise<void> {
  await prisma.documentHealthCheckEvent.create({
    data: {
      documentId: data.documentId,
      actorUserId: data.actorUserId,
      decision: data.decision,
      nextAt: data.nextAt,
      snoozedUntil: data.snoozedUntil,
      intervalDays: data.intervalDays,
      note: data.note ?? null,
    },
  });
}

/**
 * Publish reset: clear decisions/snooze/needsUpdate; set nextAt from publishedAt + interval.
 * Document.lastDecision* stay null; audit event decision = publish_reset.
 */
export async function applyPublishReset(
  prisma: PrismaDb,
  documentId: string,
  publishedAt: Date,
  actorUserId: string | null = null
): Promise<void> {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: DOC_SELECT,
  });
  if (!doc) throw new HealthCheckDocumentNotFoundError(documentId);

  const orgDefault = await loadOrgDefaultInterval(prisma);
  const intervalDays = resolveIntervalDays(doc, {
    healthCheckDefaultIntervalDays: orgDefault,
  });
  const nextAt = addDays(publishedAt, intervalDays);

  await prisma.document.update({
    where: { id: documentId },
    data: {
      healthCheckNeedsUpdate: false,
      healthCheckNeedsArchive: false,
      healthCheckSnoozedUntil: null,
      healthCheckLastDecision: null,
      healthCheckLastDecisionAt: null,
      healthCheckLastDecisionById: null,
      healthCheckNextAt: nextAt,
    },
  });

  await appendEvent(prisma, {
    documentId,
    actorUserId,
    decision: 'publish_reset',
    nextAt,
    snoozedUntil: null,
    intervalDays,
  });
}

/**
 * Still current: clear needs/snooze; nextAt = now + interval; set last decision.
 * Optional `intervalDays` overrides doc/org interval for this next check only
 * (does not change stored healthCheckIntervalDays unless same as override path later).
 */
export async function markStillValid(
  prisma: PrismaDb,
  documentId: string,
  actorUserId: string,
  now: Date = new Date(),
  intervalDaysOverride?: HealthCheckIntervalDays
): Promise<void> {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: DOC_SELECT,
  });
  if (!doc) throw new HealthCheckDocumentNotFoundError(documentId);

  const orgDefault = await loadOrgDefaultInterval(prisma);
  const intervalDays =
    intervalDaysOverride ??
    resolveIntervalDays(doc, {
      healthCheckDefaultIntervalDays: orgDefault,
    });
  const nextAt = addDays(now, intervalDays);

  await prisma.document.update({
    where: { id: documentId },
    data: {
      healthCheckNeedsUpdate: false,
      healthCheckNeedsArchive: false,
      healthCheckSnoozedUntil: null,
      healthCheckNextAt: nextAt,
      healthCheckLastDecision: 'still_valid',
      healthCheckLastDecisionAt: now,
      healthCheckLastDecisionById: actorUserId,
    },
  });

  await appendEvent(prisma, {
    documentId,
    actorUserId,
    decision: 'still_valid',
    nextAt,
    snoozedUntil: null,
    intervalDays,
  });
}

/** Needs update: flag true; clear archive/snooze; stay action_needed until publish/still valid. */
export async function markNeedsUpdate(
  prisma: PrismaDb,
  documentId: string,
  actorUserId: string,
  now: Date = new Date()
): Promise<void> {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: DOC_SELECT,
  });
  if (!doc) throw new HealthCheckDocumentNotFoundError(documentId);

  const orgDefault = await loadOrgDefaultInterval(prisma);
  const intervalDays = resolveIntervalDays(doc, {
    healthCheckDefaultIntervalDays: orgDefault,
  });

  await prisma.document.update({
    where: { id: documentId },
    data: {
      healthCheckNeedsUpdate: true,
      healthCheckNeedsArchive: false,
      healthCheckSnoozedUntil: null,
      healthCheckLastDecision: 'needs_update',
      healthCheckLastDecisionAt: now,
      healthCheckLastDecisionById: actorUserId,
    },
  });

  await appendEvent(prisma, {
    documentId,
    actorUserId,
    decision: 'needs_update',
    nextAt: doc.healthCheckNextAt,
    snoozedUntil: null,
    intervalDays,
  });
}

/** Archive recommended: flag true; clear needs_update/snooze; stay action_needed until archived/cleared. */
export async function markNeedsArchive(
  prisma: PrismaDb,
  documentId: string,
  actorUserId: string,
  now: Date = new Date()
): Promise<void> {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: DOC_SELECT,
  });
  if (!doc) throw new HealthCheckDocumentNotFoundError(documentId);

  const orgDefault = await loadOrgDefaultInterval(prisma);
  const intervalDays = resolveIntervalDays(doc, {
    healthCheckDefaultIntervalDays: orgDefault,
  });

  await prisma.document.update({
    where: { id: documentId },
    data: {
      healthCheckNeedsArchive: true,
      healthCheckNeedsUpdate: false,
      healthCheckSnoozedUntil: null,
      healthCheckLastDecision: 'archive',
      healthCheckLastDecisionAt: now,
      healthCheckLastDecisionById: actorUserId,
    },
  });

  await appendEvent(prisma, {
    documentId,
    actorUserId,
    decision: 'archive',
    nextAt: doc.healthCheckNextAt,
    snoozedUntil: null,
    intervalDays,
  });
}

/**
 * Clear Update/Archive stand; keep nextAt so a due doc stays listed as open.
 * Does not advance the schedule (unlike still_valid).
 */
export async function clearOutcome(
  prisma: PrismaDb,
  documentId: string,
  actorUserId: string
): Promise<void> {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: DOC_SELECT,
  });
  if (!doc) throw new HealthCheckDocumentNotFoundError(documentId);

  const orgDefault = await loadOrgDefaultInterval(prisma);
  const intervalDays = resolveIntervalDays(doc, {
    healthCheckDefaultIntervalDays: orgDefault,
  });

  await prisma.document.update({
    where: { id: documentId },
    data: {
      healthCheckNeedsUpdate: false,
      healthCheckNeedsArchive: false,
      healthCheckSnoozedUntil: null,
      healthCheckLastDecision: null,
      healthCheckLastDecisionAt: null,
      healthCheckLastDecisionById: null,
    },
  });

  await appendEvent(prisma, {
    documentId,
    actorUserId,
    decision: 'clear_outcome',
    nextAt: doc.healthCheckNextAt,
    snoozedUntil: null,
    intervalDays,
  });
}

/**
 * Update per-document interval (Lead/KM). Recalculates nextAt from anchor when applicable.
 * Anchor: lastDecisionAt if last decision was still_valid or snooze; else publishedAt.
 * Does not force nextAt into the past unless already due.
 */
export async function updateDocumentInterval(
  prisma: PrismaDb,
  documentId: string,
  intervalDays: HealthCheckIntervalDays,
  now: Date = new Date()
): Promise<void> {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: {
      ...DOC_SELECT,
      healthCheckLastDecision: true,
    },
  });
  if (!doc) throw new HealthCheckDocumentNotFoundError(documentId);

  let nextAt: Date | null | undefined = undefined;
  const shouldRecalcNextAt =
    doc.healthCheckNextAt != null &&
    !doc.healthCheckNeedsUpdate &&
    !doc.healthCheckNeedsArchive &&
    (doc.healthCheckSnoozedUntil == null || doc.healthCheckSnoozedUntil <= now);

  if (shouldRecalcNextAt) {
    const last = doc.healthCheckLastDecision;
    const useDecisionAt =
      (last === 'still_valid' || last === 'snooze') && doc.healthCheckLastDecisionAt != null;
    const anchor = useDecisionAt ? doc.healthCheckLastDecisionAt! : (doc.publishedAt ?? now);
    const computed = addDays(anchor, intervalDays);
    // Do not push an already-due document into the future solely by lengthening interval
    // unless computed is still in the future; never force into the past if still ahead.
    if (doc.healthCheckNextAt != null && doc.healthCheckNextAt <= now) {
      nextAt = doc.healthCheckNextAt;
    } else {
      nextAt =
        computed < now && doc.healthCheckNextAt != null && doc.healthCheckNextAt > now
          ? doc.healthCheckNextAt
          : computed;
    }
  }

  await prisma.document.update({
    where: { id: documentId },
    data: {
      healthCheckIntervalDays: intervalDays,
      ...(nextAt !== undefined ? { healthCheckNextAt: nextAt } : {}),
    },
  });
}

/** Load org default for callers that only need interval resolution. */
export async function getHealthCheckOrgDefaultInterval(
  prisma: PrismaDb
): Promise<HealthCheckIntervalDays> {
  return loadOrgDefaultInterval(prisma);
}

export type { HealthCheckDocFields };
