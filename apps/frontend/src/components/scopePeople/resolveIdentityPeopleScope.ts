import type { CanViewScopePeopleParams, MeResponse } from '../../api/me-types.js';

/**
 * Derives the People widget scope from identity (highest org level wins).
 * Does not check permissions – callers must use canViewScopePeople.
 */
export function resolveIdentityPeopleScope(
  me: MeResponse | null | undefined
): CanViewScopePeopleParams | null {
  if (me == null) return null;

  const { identity, user } = me;

  if (user.isAdmin || (identity.companyLeads?.length ?? 0) > 0) {
    const companyId =
      identity.companyLeads?.[0]?.id ??
      identity.teams?.[0]?.companyId ??
      identity.departmentLeads?.[0]?.companyId ??
      identity.departmentAuthors?.[0]?.companyId;
    if (companyId) return { scope: 'company', companyId };
    return null;
  }

  const departmentId = identity.departmentLeads?.[0]?.id ?? identity.departmentAuthors?.[0]?.id;
  if (departmentId) {
    return { scope: 'department', departmentId };
  }

  const teamId = identity.teams?.[0]?.teamId;
  if (teamId) {
    return { scope: 'team', teamId };
  }

  return null;
}

export function peopleScopeId(params: CanViewScopePeopleParams): string {
  if (params.scope === 'company') return params.companyId;
  if (params.scope === 'department') return params.departmentId;
  return params.teamId;
}
