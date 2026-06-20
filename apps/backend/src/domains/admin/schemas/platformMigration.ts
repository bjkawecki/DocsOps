import { z } from 'zod';

export const platformExportRunIdParamSchema = z.object({
  id: z.cuid(),
});

export const platformImportRunIdParamSchema = z.object({
  id: z.cuid(),
});

export const listPlatformExportRunsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
  status: z.string().optional(),
});

export const listPlatformImportRunsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
});

export const confirmPlatformImportBodySchema = z.object({
  transferPasswordHashes: z.boolean().optional().default(false),
});
