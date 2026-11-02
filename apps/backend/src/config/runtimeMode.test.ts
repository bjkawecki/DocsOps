import { afterEach, describe, expect, it } from 'vitest';
import { isAdminImpersonationEnabled, isDemoMode, shouldRunStartupSeed } from './runtimeMode.js';

describe('runtimeMode', () => {
  const env = process.env;

  afterEach(() => {
    process.env = env;
  });

  it('demo mode is opt-in via DEMO_MODE', () => {
    process.env = { ...env, DEMO_MODE: 'true', NODE_ENV: 'production' };
    expect(isDemoMode()).toBe(true);
    expect(shouldRunStartupSeed()).toBe(true);
    expect(isAdminImpersonationEnabled()).toBe(false);
  });

  it('intranet production has no seed and no impersonation', () => {
    process.env = { ...env, NODE_ENV: 'production' };
    delete process.env.DEMO_MODE;
    expect(shouldRunStartupSeed()).toBe(false);
    expect(isAdminImpersonationEnabled()).toBe(false);
  });

  it('development enables seed and impersonation', () => {
    process.env = { ...env, NODE_ENV: 'development' };
    expect(shouldRunStartupSeed()).toBe(true);
    expect(isAdminImpersonationEnabled()).toBe(true);
  });

  it('tests can enable impersonation explicitly', () => {
    process.env = { ...env, NODE_ENV: 'test', ALLOW_ADMIN_IMPERSONATION: '1' };
    expect(isAdminImpersonationEnabled()).toBe(true);
  });
});
