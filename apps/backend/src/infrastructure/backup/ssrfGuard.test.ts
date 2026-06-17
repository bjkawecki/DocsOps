import { describe, expect, it } from 'vitest';
import { assertSafeHttpsUrl, assertSafeRemoteHost } from './ssrfGuard.js';

describe('ssrfGuard', () => {
  it('allows public hostnames', () => {
    expect(() => assertSafeRemoteHost('s3.amazonaws.com')).not.toThrow();
  });

  it('blocks localhost', () => {
    expect(() => assertSafeRemoteHost('localhost')).toThrow();
  });

  it('blocks private IPv4', () => {
    expect(() => assertSafeRemoteHost('10.0.0.1')).toThrow();
  });

  it('requires https URLs', () => {
    expect(() => assertSafeHttpsUrl('http://example.com')).toThrow();
    const url = assertSafeHttpsUrl('https://s3.example.com');
    expect(url.protocol).toBe('https:');
  });
});
