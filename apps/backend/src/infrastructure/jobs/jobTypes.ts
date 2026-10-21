import { z } from 'zod';
import { cuidSchema } from '../validation/cuidSchema.js';

export const jobPayloadSchemas = {
  'documents.export.pdf': z.object({
    documentId: cuidSchema,
    versionId: cuidSchema,
    requestedByUserId: cuidSchema,
    /** Meta-line date locale; resolved at enqueue from UI/prefs/Accept-Language. */
    locale: z.enum(['en', 'de']).optional(),
  }),
  'search.reindex.incremental': z.object({
    contextId: cuidSchema.optional(),
    documentId: cuidSchema.optional(),
    trigger: z.enum(['document-created', 'document-updated', 'document-deleted', 'manual']),
  }),
  'search.reindex.full': z.object({
    requestedByUserId: cuidSchema.optional(),
    reason: z.enum(['scheduled', 'manual']).default('scheduled'),
  }),
  'notifications.send': z.object({
    eventType: z.string().min(1).max(120),
    targetUserIds: z.array(cuidSchema).max(1000),
    payload: z.record(z.string(), z.unknown()).default({}),
  }),
  'notifications.admin-broadcast': z.object({
    broadcastId: z.string().min(1).max(64),
  }),
  'maintenance.cleanup': z.object({
    task: z.enum([
      'temporary-assets',
      'failed-jobs',
      'orphaned-exports',
      'user-notifications-retention',
    ]),
    requestedByUserId: cuidSchema.optional(),
  }),
  /** EPIC-3: Markdown → Block-JSON für `DocumentVersion.blocks` und `Document.draftBlocks` (idempotent). */
  'documents.blocks.backfill': z.object({
    documentId: cuidSchema.optional(),
    limit: z.number().int().positive().max(500).optional(),
  }),
  'maintenance.backup': z.discriminatedUnion('mode', [
    z.object({
      mode: z.literal('manual'),
      backupRunId: cuidSchema,
      destinationId: cuidSchema.optional(),
      requestedByUserId: cuidSchema.optional(),
    }),
    z.object({
      mode: z.literal('schedule'),
      destinationId: cuidSchema.optional(),
    }),
    z.object({
      mode: z.literal('pre_update'),
      backupRunId: cuidSchema,
      updateRunId: cuidSchema,
      requestedByUserId: cuidSchema,
      destinationId: cuidSchema.optional(),
    }),
  ]),
  'maintenance.apply-update': z.object({
    updateRunId: cuidSchema,
  }),
  'maintenance.watch-update': z.object({
    updateRunId: cuidSchema,
  }),
  'maintenance.restore': z.object({
    restoreRunId: cuidSchema,
    source: z.enum(['history', 'upload']),
    backupRunId: cuidSchema.optional(),
    uploadObjectKey: z.string().min(1).max(1024).optional(),
  }),
  'maintenance.platform-export': z.object({
    platformExportRunId: cuidSchema,
    requestedByUserId: cuidSchema.optional(),
  }),
  'maintenance.platform-import': z.object({
    platformImportRunId: cuidSchema,
    source: z.enum(['upload', 'push']),
    uploadObjectKey: z.string().min(1).max(1024),
    options: z
      .object({
        transferPasswordHashes: z.boolean().optional(),
        merge: z.boolean().optional(),
      })
      .default({}),
  }),
} as const;

export type JobType = keyof typeof jobPayloadSchemas;

export type JobPayloadByType = {
  [K in JobType]: z.infer<(typeof jobPayloadSchemas)[K]>;
};

export const jobTypes = Object.freeze(Object.keys(jobPayloadSchemas) as JobType[]);
