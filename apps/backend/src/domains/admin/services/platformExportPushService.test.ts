import { describe, expect, it } from 'vitest';
import {
  assertAllowedPlatformPushReceiveUrl,
  PlatformExportPushError,
} from './platformExportPushService.js';
import {
  hashPlatformImportReceiveToken,
  PLATFORM_IMPORT_RECEIVE_PATH_PREFIX,
} from './platformImportReceiveService.js';

describe('platform export push URL validation', () => {
  it('allows https receive URLs with the expected path', () => {
    const url = assertAllowedPlatformPushReceiveUrl(
      `https://docs.example.com${PLATFORM_IMPORT_RECEIVE_PATH_PREFIX}abcTokenValue123456`
    );
    expect(url.protocol).toBe('https:');
  });

  it('allows http only for localhost', () => {
    expect(() =>
      assertAllowedPlatformPushReceiveUrl(
        `http://localhost:5173${PLATFORM_IMPORT_RECEIVE_PATH_PREFIX}abcTokenValue123456`
      )
    ).not.toThrow();
  });

  it('rejects http for public hosts', () => {
    expect(() =>
      assertAllowedPlatformPushReceiveUrl(
        `http://evil.example${PLATFORM_IMPORT_RECEIVE_PATH_PREFIX}abcTokenValue123456`
      )
    ).toThrow(PlatformExportPushError);
  });

  it('rejects wrong path prefix', () => {
    expect(() =>
      assertAllowedPlatformPushReceiveUrl('https://docs.example.com/api/v1/other/token')
    ).toThrow(PlatformExportPushError);
  });
});

describe('platform import receive token hash', () => {
  it('hashes deterministically', () => {
    const a = hashPlatformImportReceiveToken('token-one');
    const b = hashPlatformImportReceiveToken('token-one');
    const c = hashPlatformImportReceiveToken('token-two');
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });
});
