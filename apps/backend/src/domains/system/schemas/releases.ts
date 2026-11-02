import { z } from 'zod';

export const semverParamSchema = z
  .string()
  .regex(/^\d+\.\d+\.\d+$/, 'Version must be SemVer (e.g. 0.1.0)');

export const releaseSummarySchema = z.object({
  version: semverParamSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string().min(1),
});

export const releasesManifestSchema = z.object({
  formatVersion: z.literal(1),
  releases: z.array(releaseSummarySchema).min(1),
});

export type ReleaseSummary = z.infer<typeof releaseSummarySchema>;
export type ReleasesManifest = z.infer<typeof releasesManifestSchema>;

export type SystemVersionResponse = {
  version: string;
};

export type ReleasesListResponse = {
  releases: ReleaseSummary[];
};

export type ReleaseDetailResponse = ReleaseSummary & {
  markdown: string;
};
