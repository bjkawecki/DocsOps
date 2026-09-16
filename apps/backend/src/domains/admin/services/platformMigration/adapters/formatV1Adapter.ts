import { PLATFORM_EXPORT_FORMAT_VERSION } from '../platformManifest.js';
import type { PlatformImportAdapter } from './types.js';

/** Identity adapter for package format v1 (no on-disk rewrite). */
export const formatV1Adapter: PlatformImportAdapter = {
  exportFormatVersion: PLATFORM_EXPORT_FORMAT_VERSION,
  description: 'Platform export format v1 (identity)',
  adaptBundle: async () => {
    // Format v1 needs no structural rewrite; block coerce runs during document import.
  },
};
