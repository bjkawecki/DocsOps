import type { RecentScope } from '../hooks/useRecentItems';

import type { MeResponse } from '../api/me-types';

/** Owner-Shape für Breadcrumb-Scope (Kontext-/Subkontext-Seiten). */
export type BreadcrumbOwner = {
  companyId?: string | null;
  departmentId?: string | null;
  teamId?: string | null;
  ownerUserId?: string | null;
};

/** Scope für Metadaten-Link (inkl. Personal), aus Owner-Feldern. */
export function ownerToScopeForBreadcrumb(owner: BreadcrumbOwner): RecentScope | null {
  if (owner.ownerUserId) return { type: 'personal' };
  if (owner.companyId) return { type: 'company', id: owner.companyId };
  if (owner.departmentId) return { type: 'department', id: owner.departmentId };
  if (owner.teamId) return { type: 'team', id: owner.teamId };
  return null;
}

/**
 * Scope -> URL für Navigation (Personal, Company, Department, Team).
 */
export function scopeToUrl(scope: RecentScope): string {
  if (scope.type === 'personal') return '/personal';
  if (scope.type === 'shared') return '/personal/shared';
  if (scope.type === 'company') return '/company';
  if (scope.type === 'department') return `/department/${scope.id}`;
  if (scope.type === 'team') return `/team/${scope.id}`;
  return '/';
}

/** Scope -> Anzeige-Label (ohne Namen von Dept/Team). */
export function scopeToLabel(scope: RecentScope): string {
  if (scope.type === 'personal') return 'Personal';
  if (scope.type === 'shared') return 'Shared';
  if (scope.type === 'company') return 'Company';
  if (scope.type === 'department') return 'Department';
  if (scope.type === 'team') return 'Team';
  return 'Context';
}

/** Whether the user may manage a scope (create, trash/archive tabs). Mirrors scope page canManage rules. */
export function deriveOwnerScopeCanManage(
  me: MeResponse | undefined,
  owner: BreadcrumbOwner | null | undefined
): boolean {
  if (!me || !owner) return false;
  if (owner.ownerUserId) return owner.ownerUserId === me.user?.id;
  if (owner.companyId != null && me.identity?.companyLeads?.some((c) => c.id === owner.companyId)) {
    return true;
  }
  if (
    owner.departmentId != null &&
    me.identity?.departmentLeads?.some((d) => d.id === owner.departmentId)
  ) {
    return true;
  }
  if (
    owner.teamId != null &&
    me.identity?.teams?.some((t) => t.teamId === owner.teamId && t.role === 'leader')
  ) {
    return true;
  }
  return false;
}

/**
 * Whether the user holds the additive Author role on the context owner unit
 * (team / department / company). Lead-only users return false.
 */
export function deriveOwnerScopeIsAuthor(
  me: MeResponse | undefined,
  owner: BreadcrumbOwner | null | undefined
): boolean {
  if (!me || !owner) return false;
  if (owner.ownerUserId) return false;
  if (owner.teamId != null) {
    return (
      me.identity?.teams?.some((t) => t.teamId === owner.teamId && t.role === 'author') ?? false
    );
  }
  if (owner.departmentId != null) {
    return me.identity?.departmentAuthors?.some((d) => d.id === owner.departmentId) ?? false;
  }
  if (owner.companyId != null) {
    return me.identity?.companyAuthors?.some((c) => c.id === owner.companyId) ?? false;
  }
  return false;
}

/**
 * Whether the user may promote/demote scope authors for the context owner unit.
 * Mirrors backend canManageTeamAuthors / canManageDepartmentAuthors / canManageCompanyAuthors.
 */
export function deriveOwnerScopeCanManageAuthors(
  me: MeResponse | undefined,
  owner: BreadcrumbOwner | null | undefined
): boolean {
  if (!me || !owner) return false;
  if (me.user?.isAdmin) return true;
  if (owner.ownerUserId) return false;
  if (owner.teamId != null) {
    if (me.identity?.teams?.some((t) => t.teamId === owner.teamId && t.role === 'leader')) {
      return true;
    }
    if (
      owner.departmentId != null &&
      me.identity?.departmentLeads?.some((d) => d.id === owner.departmentId)
    ) {
      return true;
    }
    return false;
  }
  if (owner.departmentId != null) {
    return me.identity?.departmentLeads?.some((d) => d.id === owner.departmentId) ?? false;
  }
  if (owner.companyId != null) {
    return me.identity?.companyLeads?.some((c) => c.id === owner.companyId) ?? false;
  }
  return false;
}
