import { describe, expect, it } from 'vitest';
import { formatPlatformImportUploadError } from './platformImportUploadErrors.js';

describe('formatPlatformImportUploadError', () => {
  it('maps MinIO errors to client errors', () => {
    const result = formatPlatformImportUploadError(new Error('MinIO bucket is not reachable'));
    expect(result.clientError).toBe(true);
    expect(result.message).toContain('MinIO');
  });

  it('maps zstd/tar failures to a clear unpack message', () => {
    const result = formatPlatformImportUploadError(
      new Error('Command failed: zstd -d -c ... tar -xf ...')
    );
    expect(result.clientError).toBe(true);
    expect(result.message).toContain('Could not unpack');
  });

  it('maps file size limit to client error', () => {
    const result = formatPlatformImportUploadError(new Error('File size limit reached'));
    expect(result.clientError).toBe(true);
    expect(result.message).toContain('too large');
  });

  it('keeps unknown errors as server errors', () => {
    const result = formatPlatformImportUploadError(new Error('Unexpected database failure'));
    expect(result.clientError).toBe(false);
  });
});
