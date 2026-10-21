import { z } from 'zod';
import { cuidSchema } from '../../../infrastructure/validation/cuidSchema.js';

export const restoreRunIdParamSchema = z.object({
  id: cuidSchema,
});

export const listRestoreRunsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const restoreFromBackupParamSchema = z.object({
  backupRunId: cuidSchema,
});
