import { describe, expect, it } from 'vitest';
import type { MeResponse } from '../../api/me-types.js';
import { resolveIdentityPeopleScope } from './resolveIdentityPeopleScope.js';

function me(partial: Partial<MeResponse['identity']> & { isAdmin?: boolean }): MeResponse {
  const { isAdmin = false, ...identity } = partial;
  return {
    user: { id: 'u1', name: 'Test', email: null, isAdmin, hasLocalLogin: true },
    identity: {
      teams: [],
      departments: [],
      departmentLeads: [],
      departmentAuthors: [],
      companyLeads: [],
      ...identity,
    },
    preferences: {},
  };
}

const team = {
  teamId: 't1',
  teamName: 'Team',
  departmentId: 'd1',
  departmentName: 'Dept',
  companyId: 'c1',
  role: 'member' as const,
};

describe('resolveIdentityPeopleScope', () => {
  it('returns null for empty identity', () => {
    expect(resolveIdentityPeopleScope(me({}))).toBeNull();
    expect(resolveIdentityPeopleScope(null)).toBeNull();
  });

  it('member → own team', () => {
    expect(resolveIdentityPeopleScope(me({ teams: [team] }))).toEqual({
      scope: 'team',
      teamId: 't1',
    });
  });

  it('department lead → department (not team)', () => {
    expect(
      resolveIdentityPeopleScope(
        me({
          teams: [{ ...team, role: 'leader' }],
          departmentLeads: [{ id: 'd1', name: 'Dept', companyId: 'c1' }],
        })
      )
    ).toEqual({ scope: 'department', departmentId: 'd1' });
  });

  it('department author → department', () => {
    expect(
      resolveIdentityPeopleScope(
        me({
          departmentAuthors: [{ id: 'd2', name: 'Dept 2', companyId: 'c1' }],
        })
      )
    ).toEqual({ scope: 'department', departmentId: 'd2' });
  });

  it('company lead → company', () => {
    expect(
      resolveIdentityPeopleScope(
        me({
          teams: [team],
          departmentLeads: [{ id: 'd1', name: 'Dept', companyId: 'c1' }],
          companyLeads: [{ id: 'c1', name: 'Co' }],
        })
      )
    ).toEqual({ scope: 'company', companyId: 'c1' });
  });

  it('admin with team companyId → company', () => {
    expect(resolveIdentityPeopleScope(me({ isAdmin: true, teams: [team] }))).toEqual({
      scope: 'company',
      companyId: 'c1',
    });
  });

  it('admin without company id → null', () => {
    expect(resolveIdentityPeopleScope(me({ isAdmin: true }))).toBeNull();
  });
});
