import { describe, it, expect } from 'vitest';
import {
  isEligible,
  isActionNeeded,
  matchesReason,
  matchesOutcome,
  deriveReason,
  deriveOutcome,
  resolveIntervalDays,
  isSnoozeActive,
  addDays,
  type HealthCheckDocFields,
} from './healthCheckPolicy.js';

function baseDoc(over: Partial<HealthCheckDocFields> = {}): HealthCheckDocFields {
  return {
    publishedAt: new Date('2026-01-01T00:00:00.000Z'),
    archivedAt: null,
    deletedAt: null,
    contextId: 'ctx1',
    healthCheckIntervalDays: null,
    healthCheckNextAt: null,
    healthCheckNeedsUpdate: false,
    healthCheckNeedsArchive: false,
    healthCheckSnoozedUntil: null,
    ...over,
  };
}

describe('healthCheckPolicy', () => {
  const now = new Date('2026-06-01T12:00:00.000Z');

  it('resolveIntervalDays uses doc override then org default', () => {
    expect(
      resolveIntervalDays({ healthCheckIntervalDays: 60 }, { healthCheckDefaultIntervalDays: 90 })
    ).toBe(60);
    expect(
      resolveIntervalDays({ healthCheckIntervalDays: null }, { healthCheckDefaultIntervalDays: 90 })
    ).toBe(90);
  });

  it('resolveIntervalDays throws on invalid org default', () => {
    expect(() =>
      resolveIntervalDays({ healthCheckIntervalDays: null }, { healthCheckDefaultIntervalDays: 45 })
    ).toThrow(/Invalid health check interval/);
  });

  it('isEligible requires published + context, not archived/deleted', () => {
    expect(isEligible(baseDoc())).toBe(true);
    expect(isEligible(baseDoc({ publishedAt: null }))).toBe(false);
    expect(isEligible(baseDoc({ contextId: null }))).toBe(false);
    expect(isEligible(baseDoc({ archivedAt: now }))).toBe(false);
    expect(isEligible(baseDoc({ deletedAt: now }))).toBe(false);
  });

  it('needs_update is action_needed with outcome needs_update, not open', () => {
    const doc = baseDoc({ healthCheckNeedsUpdate: true });
    expect(isActionNeeded(doc, now)).toBe(true);
    expect(deriveOutcome(doc, now)).toBe('needs_update');
    expect(matchesOutcome(doc, 'needs_update', now)).toBe(true);
    expect(matchesOutcome(doc, 'open', now)).toBe(false);
    expect(matchesReason(doc, 'due', now)).toBe(false);
    expect(deriveReason(doc, now)).toBeNull();
  });

  it('archive recommended is action_needed with outcome archive', () => {
    const doc = baseDoc({ healthCheckNeedsArchive: true });
    expect(isActionNeeded(doc, now)).toBe(true);
    expect(deriveOutcome(doc, now)).toBe('archive');
    expect(matchesOutcome(doc, 'archive', now)).toBe(true);
    expect(matchesOutcome(doc, 'open', now)).toBe(false);
  });

  it('due nextAt is action_needed with reason due and outcome open', () => {
    const doc = baseDoc({
      healthCheckNextAt: new Date('2026-05-01T00:00:00.000Z'),
    });
    expect(isActionNeeded(doc, now)).toBe(true);
    expect(matchesReason(doc, 'due', now)).toBe(true);
    expect(deriveReason(doc, now)).toBe('due');
    expect(deriveOutcome(doc, now)).toBe('open');
    expect(matchesOutcome(doc, 'open', now)).toBe(true);
  });

  it('active snooze is not action_needed', () => {
    const doc = baseDoc({
      healthCheckNextAt: new Date('2026-05-01T00:00:00.000Z'),
      healthCheckSnoozedUntil: new Date('2026-07-01T00:00:00.000Z'),
    });
    expect(isSnoozeActive(doc, now)).toBe(true);
    expect(isActionNeeded(doc, now)).toBe(false);
    expect(matchesReason(doc, 'all', now)).toBe(false);
  });

  it('expired snooze is due + open', () => {
    const doc = baseDoc({
      healthCheckSnoozedUntil: new Date('2026-05-01T00:00:00.000Z'),
    });
    expect(isActionNeeded(doc, now)).toBe(true);
    expect(matchesReason(doc, 'due', now)).toBe(true);
    expect(matchesOutcome(doc, 'open', now)).toBe(true);
  });

  it('draft / archived never action_needed', () => {
    expect(isActionNeeded(baseDoc({ publishedAt: null }), now)).toBe(false);
    expect(isActionNeeded(baseDoc({ archivedAt: now }), now)).toBe(false);
  });

  it('addDays advances UTC calendar days', () => {
    const from = new Date('2026-01-01T00:00:00.000Z');
    expect(addDays(from, 90).toISOString()).toBe('2026-04-01T00:00:00.000Z');
  });
});
