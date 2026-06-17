import { z } from 'zod';

export const restoreRunIdParamSchema = z.object({
  id: z.cuid(),
});

export const listRestoreRunsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const restoreFromBackupParamSchema = z.object({
  backupRunId: z.cuid(),
});
