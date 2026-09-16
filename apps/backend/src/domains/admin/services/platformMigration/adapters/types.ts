/**
 * Transforms an extracted platform-export bundle in place before domain import.
 * Adapters must be idempotent.
 */
export type PlatformImportAdapter = {
  exportFormatVersion: number;
  description: string;
  adaptBundle: (bundleDir: string) => Promise<void>;
};
