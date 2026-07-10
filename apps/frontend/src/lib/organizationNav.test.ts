import { describe, expect, it } from 'vitest';
import type { MeResponse } from '../api/me-types.js';
import { hasOrganizationMembership, shouldShowOrganizationNav } from './organizationNav.js';

function me(partial: Partial<MeResponse['identity']>): MeResponse {
  return {
    user: { id: 'u1', name: 'Test', email: null, isAdmin: false, hasLocalLogin: true },
    identity: {
      teams: [],
      departments: [],
      departmentLeads: [],
      departmentAuthors: [],
      companyLeads: [],
      ...partial,
    },
    preferences: {},
  };
}

describe('organizationNav', () => {
  it('hasOrganizationMembership is false for empty identity', () => {
    expect(hasOrganizationMembership(me({}))).toBe(false);
  });

  it('hasOrganizationMembership is true when user has a team', () => {
    expect(
      hasOrganizationMembership(
        me({
          teams: [
            {
              teamId: 't1',
              teamName: 'T',
              departmentId: 'd1',
              departmentName: 'D',
              companyId: 'c1',
              role: 'member',
            },
          ],
        })
      )
    ).toBe(true);
  });

  it('shouldShowOrganizationNav hides org for user without membership', () => {
    expect(shouldShowOrganizationNav(me({}), false, undefined)).toBe(false);
  });

  it('shouldShowOrganizationNav hides org for admin without company', () => {
    expect(shouldShowOrganizationNav(me({}), true, undefined)).toBe(false);
  });

  it('shouldShowOrganizationNav shows org for admin with company', () => {
    expect(shouldShowOrganizationNav(me({}), true, 'c1')).toBe(true);
  });
});
