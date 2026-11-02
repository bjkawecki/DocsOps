/** Allowed Do11y health-check interval steps (mirrors backend whitelist). */
export const HEALTH_CHECK_INTERVAL_DAYS = [30, 60, 90, 180, 365] as const;
export type HealthCheckIntervalDays = (typeof HEALTH_CHECK_INTERVAL_DAYS)[number];

export const DEFAULT_HEALTH_CHECK_INTERVAL_DAYS: HealthCheckIntervalDays = 90;

export function isHealthCheckIntervalDays(value: number): value is HealthCheckIntervalDays {
  return (HEALTH_CHECK_INTERVAL_DAYS as readonly number[]).includes(value);
}

export function healthCheckIntervalSelectData(
  labelForDays: (days: HealthCheckIntervalDays) => string
): { value: string; label: string }[] {
  return HEALTH_CHECK_INTERVAL_DAYS.map((days) => ({
    value: String(days),
    label: labelForDays(days),
  }));
}
