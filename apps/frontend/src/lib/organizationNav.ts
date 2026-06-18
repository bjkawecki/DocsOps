import type { MeResponse } from '../api/me-types.js';

/** User has org membership or a lead role (can navigate company / department / team). */
export function hasOrganizationMembership(me: MeResponse): boolean {
  const identity = me.identity;
  return (
    identity.teams.length > 0 ||
    identity.departments.length > 0 ||
    identity.departmentLeads.length > 0 ||
    identity.companyLeads.length > 0
  );
}

/**
 * Show the Organization block in the sidebar when the user can reach at least one org scope.
 * Admins without a company yet use Admin → Company instead.
 */
export function shouldShowOrganizationNav(
  me: MeResponse | undefined,
  isAdmin: boolean,
  effectiveCompanyId: string | undefined
): boolean {
  if (!me?.identity) return false;
  if (hasOrganizationMembership(me)) return true;
  if (isAdmin && effectiveCompanyId) return true;
  return false;
}
