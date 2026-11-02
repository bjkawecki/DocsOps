import type { Prisma, PrismaClient } from '../../../../../generated/prisma/client.js';
import {
  addDays,
  isEligible,
  resolveIntervalDays,
  type HealthCheckDocFields,
} from './healthCheckPolicy.js';
import type { HealthCheckIntervalDays } from '../../schemas/healthCheck.js';

/** Minimal fields needed to materialize nextAt / clear expired snooze. */
export type HealthCheckMaterializeDoc = HealthCheckDocFields & {
  id: string;
  publishedAt: Date | null;
};

/**
 * Fill missing nextAt and clear expired snooze for eligible published docs.
 * Returns ids that were written.
 */
export async function materializeHealthCheckFields(
  prisma: PrismaClient,
  docs: HealthCheckMaterializeDoc[],
  orgDefault: HealthCheckIntervalDays,
  now: Date = new Date()
): Promise<string[]> {
  const updatedDocumentIds: string[] = [];

  for (const doc of docs) {
    if (!isEligible(doc) || !doc.publishedAt) continue;

    let changed = false;
    const data: Prisma.DocumentUpdateInput = {};

    if (doc.healthCheckNextAt == null) {
      const intervalDays = resolveIntervalDays(doc, {
        healthCheckDefaultIntervalDays: orgDefault,
      });
      data.healthCheckNextAt = addDays(doc.publishedAt, intervalDays);
      changed = true;
    }

    if (doc.healthCheckSnoozedUntil != null && doc.healthCheckSnoozedUntil <= now) {
      data.healthCheckSnoozedUntil = null;
      if (doc.healthCheckNextAt == null && data.healthCheckNextAt == null) {
        const intervalDays = resolveIntervalDays(doc, {
          healthCheckDefaultIntervalDays: orgDefault,
        });
        data.healthCheckNextAt = addDays(doc.publishedAt, intervalDays);
      }
      changed = true;
    }

    if (changed) {
      await prisma.document.update({ where: { id: doc.id }, data });
      updatedDocumentIds.push(doc.id);
    }
  }

  return updatedDocumentIds;
}
