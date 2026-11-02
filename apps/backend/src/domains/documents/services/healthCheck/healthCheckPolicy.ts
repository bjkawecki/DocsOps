import {
  isHealthCheckIntervalDays,
  type HealthCheckIntervalDays,
  type HealthCheckOutcome,
  type HealthCheckReason,
} from '../../schemas/healthCheck.js';

/** Document fields needed for Do11y eligibility / action_needed. */
export type HealthCheckDocFields = {
  publishedAt: Date | null;
  archivedAt: Date | null;
  deletedAt: Date | null;
  contextId: string | null;
  healthCheckIntervalDays: number | null;
  healthCheckNextAt: Date | null;
  healthCheckNeedsUpdate: boolean;
  healthCheckNeedsArchive: boolean;
  healthCheckSnoozedUntil: Date | null;
};

export type HealthCheckSettingsFields = {
  healthCheckDefaultIntervalDays: number;
};

/**
 * Resolves the effective interval (doc override or org default).
 * Throws if org default is not a valid step (no silent fallback).
 */
export function resolveIntervalDays(
  doc: Pick<HealthCheckDocFields, 'healthCheckIntervalDays'>,
  settings: HealthCheckSettingsFields
): HealthCheckIntervalDays {
  const raw = doc.healthCheckIntervalDays ?? settings.healthCheckDefaultIntervalDays;
  if (!isHealthCheckIntervalDays(raw)) {
    throw new Error(
      `Invalid health check interval days: ${raw}. Expected one of 30, 60, 90, 180, 365.`
    );
  }
  return raw;
}

/** Published, in a context, not archived/deleted. */
export function isEligible(
  doc: Pick<HealthCheckDocFields, 'publishedAt' | 'archivedAt' | 'deletedAt' | 'contextId'>
): boolean {
  return (
    doc.publishedAt != null &&
    doc.archivedAt == null &&
    doc.deletedAt == null &&
    doc.contextId != null
  );
}

function snoozeActive(doc: HealthCheckDocFields, now: Date): boolean {
  return doc.healthCheckSnoozedUntil != null && doc.healthCheckSnoozedUntil > now;
}

function snoozeExpired(doc: HealthCheckDocFields, now: Date): boolean {
  return doc.healthCheckSnoozedUntil != null && doc.healthCheckSnoozedUntil <= now;
}

export function isDueBySchedule(doc: HealthCheckDocFields, now: Date = new Date()): boolean {
  return snoozeExpired(doc, now) || dueByNextAt(doc, now);
}

function dueByNextAt(doc: HealthCheckDocFields, now: Date): boolean {
  return (
    doc.healthCheckSnoozedUntil == null &&
    doc.healthCheckNextAt != null &&
    doc.healthCheckNextAt <= now
  );
}

/**
 * Derived action_needed (not a DB column).
 */
export function isActionNeeded(doc: HealthCheckDocFields, now: Date = new Date()): boolean {
  if (!isEligible(doc)) return false;
  if (doc.healthCheckNeedsUpdate) return true;
  if (doc.healthCheckNeedsArchive) return true;
  if (snoozeExpired(doc, now)) return true;
  if (dueByNextAt(doc, now)) return true;
  return false;
}

/** Entry reason for hub rows (today only schedule due). */
export function deriveReason(doc: HealthCheckDocFields, now: Date = new Date()): 'due' | null {
  if (!isActionNeeded(doc, now)) return null;
  if (isDueBySchedule(doc, now)) return 'due';
  return null;
}

/** Post-review stand while still on the list. */
export function deriveOutcome(
  doc: HealthCheckDocFields,
  now: Date = new Date()
): 'open' | 'needs_update' | 'archive' {
  if (doc.healthCheckNeedsArchive) return 'archive';
  if (doc.healthCheckNeedsUpdate) return 'needs_update';
  if (isActionNeeded(doc, now)) return 'open';
  return 'open';
}

export function matchesReason(
  doc: HealthCheckDocFields,
  reason: HealthCheckReason,
  now: Date = new Date()
): boolean {
  if (!isActionNeeded(doc, now)) return false;
  if (reason === 'all') return true;
  if (reason === 'due') return isDueBySchedule(doc, now);
  return false;
}

export function matchesOutcome(
  doc: HealthCheckDocFields,
  outcome: HealthCheckOutcome,
  now: Date = new Date()
): boolean {
  if (!isActionNeeded(doc, now)) return false;
  switch (outcome) {
    case 'all':
      return true;
    case 'open':
      return !doc.healthCheckNeedsUpdate && !doc.healthCheckNeedsArchive;
    case 'needs_update':
      return doc.healthCheckNeedsUpdate;
    case 'archive':
      return doc.healthCheckNeedsArchive;
    default:
      return false;
  }
}

export function addDays(from: Date, days: number): Date {
  const d = new Date(from.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/** Whether an active snooze suppresses listing (eligible but not action_needed for that reason). */
export function isSnoozeActive(doc: HealthCheckDocFields, now: Date = new Date()): boolean {
  return isEligible(doc) && snoozeActive(doc, now);
}
