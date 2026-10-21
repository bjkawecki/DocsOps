import { z } from 'zod';

/**
 * Validates Prisma `@default(cuid())` IDs (cuid v1 format).
 * Do not use `z.cuid()` – Zod marks that API deprecated in favour of cuid2, but the
 * database still stores and generates cuid v1. Migrating to cuid2 is a separate change.
 */
export const cuidSchema = z.string().regex(/^[cC][0-9a-z]{6,}$/, {
  error: 'Invalid id',
});
