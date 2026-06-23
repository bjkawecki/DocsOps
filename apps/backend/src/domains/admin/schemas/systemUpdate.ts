import { z } from 'zod';

export const adminSystemUpdateStatusSchema = z.object({
  installedVersion: z.string().min(1),
  updateCheckEnabled: z.boolean(),
  latestVersion: z.string().nullable(),
  latestReleaseTag: z.string().nullable(),
  updateAvailable: z.boolean(),
  releaseUrl: z.url().nullable(),
  checkedAt: z.iso.datetime().nullable(),
  checkError: z.string().nullable(),
});

export type AdminSystemUpdateStatus = z.infer<typeof adminSystemUpdateStatusSchema>;

export const adminSystemCheckUpdatesResponseSchema = z.object({
  status: adminSystemUpdateStatusSchema,
  notificationSent: z.boolean(),
});

export type AdminSystemCheckUpdatesResponse = z.infer<typeof adminSystemCheckUpdatesResponseSchema>;
