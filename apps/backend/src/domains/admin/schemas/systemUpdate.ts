import { z } from 'zod';
import { adminUpdateRunSchema } from './updates.js';

export const adminSystemUpdateStatusSchema = z.object({
  installedVersion: z.string().min(1),
  updateCheckEnabled: z.boolean(),
  updateCheckConfigured: z.boolean(),
  githubRepo: z.string().nullable(),
  upcomingReleaseNotesVersion: z.string().nullable(),
  upcomingReleaseNotesMarkdown: z.string().nullable(),
  upcomingReleaseNotesError: z.string().nullable(),
  latestVersion: z.string().nullable(),
  latestReleaseTag: z.string().nullable(),
  updateAvailable: z.boolean(),
  releaseUrl: z.url().nullable(),
  checkedAt: z.iso.datetime().nullable(),
  checkError: z.string().nullable(),
  agentConfigured: z.boolean(),
  agentMissingEnvVars: z.array(z.string()),
  canApplyUpdate: z.boolean(),
  activeUpdateRun: adminUpdateRunSchema.nullable(),
});

export type AdminSystemUpdateStatus = z.infer<typeof adminSystemUpdateStatusSchema>;

export const adminSystemCheckUpdatesResponseSchema = z.object({
  status: adminSystemUpdateStatusSchema,
  notificationSent: z.boolean(),
});

export type AdminSystemCheckUpdatesResponse = z.infer<typeof adminSystemCheckUpdatesResponseSchema>;

export const adminSystemSettingsSchema = z.object({
  updateCheckEnabled: z.boolean(),
  smtpEnabled: z.boolean(),
  smtpHost: z.string().nullable(),
  smtpPort: z.number().int().nullable(),
  smtpEncryption: z.enum(['none', 'starttls', 'tls']).nullable(),
  smtpUsername: z.string().nullable(),
  smtpPasswordConfigured: z.boolean(),
  smtpFromAddress: z.string().nullable(),
  smtpFromName: z.string().nullable(),
  updatedAt: z.iso.datetime(),
});

export type AdminSystemSettings = z.infer<typeof adminSystemSettingsSchema>;

export const patchAdminSystemSettingsBodySchema = z.object({
  updateCheckEnabled: z.boolean().optional(),
  smtpEnabled: z.boolean().optional(),
  smtpHost: z.string().max(255).nullable().optional(),
  smtpPort: z.number().int().min(1).max(65535).nullable().optional(),
  smtpEncryption: z.enum(['none', 'starttls', 'tls']).nullable().optional(),
  smtpUsername: z.string().max(255).nullable().optional(),
  smtpPassword: z.string().max(512).nullable().optional(),
  smtpFromAddress: z.string().max(320).nullable().optional(),
  smtpFromName: z.string().max(255).nullable().optional(),
});

export type PatchAdminSystemSettingsBody = z.infer<typeof patchAdminSystemSettingsBodySchema>;

export const adminSystemMailTestBodySchema = z.object({
  to: z.email().optional(),
});

export type AdminSystemMailTestBody = z.infer<typeof adminSystemMailTestBodySchema>;

export const adminSystemMailTestResponseSchema = z.object({
  ok: z.literal(true),
});
