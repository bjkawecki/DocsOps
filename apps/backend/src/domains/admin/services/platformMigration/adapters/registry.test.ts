import { describe, expect, it } from 'vitest';
import {
  getPlatformImportAdapter,
  isSupportedExportFormatVersion,
  listSupportedExportFormatVersions,
  UnsupportedExportFormatVersionError,
} from './registry.js';

describe('platform import adapter registry', () => {
  it('lists format v1 as supported', () => {
    expect(listSupportedExportFormatVersions()).toEqual([1]);
    expect(isSupportedExportFormatVersion(1)).toBe(true);
    expect(isSupportedExportFormatVersion(2)).toBe(false);
  });

  it('returns the v1 identity adapter', async () => {
    const adapter = getPlatformImportAdapter(1);
    expect(adapter.exportFormatVersion).toBe(1);
    await expect(adapter.adaptBundle('/tmp/unused')).resolves.toBeUndefined();
  });

  it('throws for unknown format versions', () => {
    expect(() => getPlatformImportAdapter(99)).toThrow(UnsupportedExportFormatVersionError);
  });
});
