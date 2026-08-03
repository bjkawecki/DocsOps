import { afterEach, describe, expect, it } from 'vitest';
import { DEMO_SEED_EMAIL_BY_ROLE, demoSeedEmailForRole } from '../schemas/demoLogin.js';

describe('demoSeedEmailForRole', () => {
  const prevAdmin = process.env.ADMIN_EMAIL;

  afterEach(() => {
    if (prevAdmin === undefined) delete process.env.ADMIN_EMAIL;
    else process.env.ADMIN_EMAIL = prevAdmin;
  });

  it('uses ADMIN_EMAIL for admin when set', () => {
    process.env.ADMIN_EMAIL = 'admin@demo.docsops.de';
    expect(demoSeedEmailForRole('admin')).toBe('admin@demo.docsops.de');
  });

  it('falls back to seed default for admin when ADMIN_EMAIL unset', () => {
    delete process.env.ADMIN_EMAIL;
    expect(demoSeedEmailForRole('admin')).toBe(DEMO_SEED_EMAIL_BY_ROLE.admin);
  });

  it('ignores ADMIN_EMAIL for non-admin roles', () => {
    process.env.ADMIN_EMAIL = 'admin@demo.docsops.de';
    expect(demoSeedEmailForRole('member')).toBe(DEMO_SEED_EMAIL_BY_ROLE.member);
  });
});
