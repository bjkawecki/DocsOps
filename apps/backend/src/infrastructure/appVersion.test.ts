import { afterEach, describe, expect, it, vi } from 'vitest';

describe('resolveAppVersion', () => {
  const previous = process.env.APP_VERSION;

  afterEach(() => {
    if (previous === undefined) {
      delete process.env.APP_VERSION;
    } else {
      process.env.APP_VERSION = previous;
    }
    vi.resetModules();
  });

  it('returns APP_VERSION when set', async () => {
    process.env.APP_VERSION = '1.2.3';
    const { resolveAppVersion } = await import('./appVersion.js');
    expect(resolveAppVersion()).toBe('1.2.3');
  });

  it('throws when APP_VERSION is missing', async () => {
    delete process.env.APP_VERSION;
    await expect(async () => {
      await import('./appVersion.js');
    }).rejects.toThrow(/APP_VERSION is not set/);
  });
});
