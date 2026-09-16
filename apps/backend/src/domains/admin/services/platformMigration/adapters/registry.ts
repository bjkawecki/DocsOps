import { formatV1Adapter } from './formatV1Adapter.js';
import type { PlatformImportAdapter } from './types.js';

const adaptersByVersion = new Map<number, PlatformImportAdapter>([
  [formatV1Adapter.exportFormatVersion, formatV1Adapter],
]);

export function listSupportedExportFormatVersions(): number[] {
  return [...adaptersByVersion.keys()].sort((a, b) => a - b);
}

export function isSupportedExportFormatVersion(version: number): boolean {
  return adaptersByVersion.has(version);
}

export class UnsupportedExportFormatVersionError extends Error {
  constructor(readonly version: number) {
    const supported = listSupportedExportFormatVersions().join(', ');
    super(`Unsupported exportFormatVersion: ${version}. Supported: ${supported}`);
    this.name = 'UnsupportedExportFormatVersionError';
  }
}

export function getPlatformImportAdapter(version: number): PlatformImportAdapter {
  const adapter = adaptersByVersion.get(version);
  if (!adapter) {
    throw new UnsupportedExportFormatVersionError(version);
  }
  return adapter;
}
