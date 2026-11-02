import { z } from 'zod';

/** Allowed health-check interval steps (org default and per-document). */
export const HEALTH_CHECK_INTERVAL_DAYS = [30, 60, 90, 180, 365] as const;
export type HealthCheckIntervalDays = (typeof HEALTH_CHECK_INTERVAL_DAYS)[number];

export const healthCheckIntervalDaysSchema = z.union([
  z.literal(30),
  z.literal(60),
  z.literal(90),
  z.literal(180),
  z.literal(365),
]);

/** Lead decisions stored on Document.healthCheckLastDecision. */
export const healthCheckDecisionSchema = z.enum([
  'still_valid',
  'needs_update',
  'archive',
  'snooze',
]);
export type HealthCheckDecision = z.infer<typeof healthCheckDecisionSchema>;

/** Audit event decisions (includes publish reset / clear outcome). */
export const healthCheckEventDecisionSchema = z.enum([
  'still_valid',
  'needs_update',
  'archive',
  'snooze',
  'publish_reset',
  'clear_outcome',
]);
export type HealthCheckEventDecision = z.infer<typeof healthCheckEventDecisionSchema>;

/** Entry reason (why on the list) – not the post-review outcome. */
export const healthCheckReasonSchema = z.enum(['all', 'due']);
export type HealthCheckReason = z.infer<typeof healthCheckReasonSchema>;

/** Post-review stand / Folge on the list. */
export const healthCheckOutcomeSchema = z.enum(['all', 'open', 'needs_update', 'archive']);
export type HealthCheckOutcome = z.infer<typeof healthCheckOutcomeSchema>;

/** Body: PATCH /documents/:id/freshness/interval */
export const documentHealthCheckIntervalBodySchema = z.object({
  intervalDays: healthCheckIntervalDaysSchema,
});
export type DocumentHealthCheckIntervalBody = z.infer<typeof documentHealthCheckIntervalBodySchema>;

/** Body: POST /documents/:id/freshness/still-valid – optional next-check interval. */
export const documentHealthCheckStillValidBodySchema = z.object({
  intervalDays: healthCheckIntervalDaysSchema.optional(),
});
export type DocumentHealthCheckStillValidBody = z.infer<
  typeof documentHealthCheckStillValidBodySchema
>;

export function isHealthCheckIntervalDays(value: number): value is HealthCheckIntervalDays {
  return (HEALTH_CHECK_INTERVAL_DAYS as readonly number[]).includes(value);
}
