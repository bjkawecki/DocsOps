import type { HealthCheckIntervalDays } from '../../schemas/healthCheck.js';

/** Soft hub hint only; never expands action_needed. */
export type HealthCheckAttentionHint = 'high_traffic';

/** Minimum all-time reader-days for high_traffic. */
export const HEALTH_CHECK_ATTENTION_MIN_VIEWS = 5;

export type ComputeAttentionHintInput = {
  viewCount: number;
  publishedAt: Date | null;
  intervalDays: HealthCheckIntervalDays;
  now?: Date;
};

/**
 * View×Alter soft signal for Lead/KM hub rows that are already action_needed.
 * high_traffic when viewCount and age (since publish) clear fixed thresholds.
 */
export function computeAttentionHint(
  input: ComputeAttentionHintInput
): HealthCheckAttentionHint | null {
  const now = input.now ?? new Date();
  if (input.publishedAt == null) return null;
  if (input.viewCount < HEALTH_CHECK_ATTENTION_MIN_VIEWS) return null;

  const ageMs = now.getTime() - input.publishedAt.getTime();
  if (ageMs < 0) return null;
  const ageDays = Math.floor(ageMs / (24 * 60 * 60 * 1000));
  const halfInterval = Math.ceil(input.intervalDays / 2);
  if (ageDays < halfInterval) return null;

  return 'high_traffic';
}

/** Sort key: high_traffic first (0), else 1. */
export function attentionHintSortRank(hint: HealthCheckAttentionHint | null): number {
  return hint === 'high_traffic' ? 0 : 1;
}
