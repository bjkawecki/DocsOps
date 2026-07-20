export function isActive(path: string, current: string): boolean {
  if (path === '/') return current === '/';
  return current === path || current.startsWith(path + '/');
}

/** Shared styles for sidebar nav links (hover/active). Uses theme variables. */
export function getNavLinkStyles(): { root: Record<string, unknown> } {
  return {
    root: {
      borderRadius: 'var(--mantine-radius-sm)',
      padding: '2px 6px',
      minHeight: 28,
      fontWeight: 500,
      fontSize: 'var(--mantine-font-size-sm)',
      '&[data-active]': {
        backgroundColor:
          'light-dark(color-mix(in srgb, var(--mantine-primary-color-filled) 14%, transparent), color-mix(in srgb, var(--mantine-primary-color-filled) 24%, transparent))',
        color: 'var(--mantine-primary-color-filled)',
        fontWeight: 600,
        boxShadow: 'inset 2px 0 0 var(--mantine-primary-color-filled)',
      },
    },
  };
}

/** Rolle aus MeResponse ableiten (gleiche Reihenfolge wie Backend: Admin > Company Lead > Department Lead > Team Lead > User). */
export function getDisplayRole(me: {
  user: { isAdmin: boolean };
  identity: {
    companyLeads: unknown[];
    departmentLeads: unknown[];
    departmentAuthors?: unknown[];
    teams: { role: string }[];
  };
}): string {
  if (me.user.isAdmin) return 'Admin';
  if ((me.identity.companyLeads?.length ?? 0) > 0) return 'Company Lead';
  if ((me.identity.departmentLeads?.length ?? 0) > 0) return 'Department Lead';
  if ((me.identity.departmentAuthors?.length ?? 0) > 0) return 'Department Author';
  if (me.identity.teams?.some((t) => t.role === 'leader')) return 'Team Lead';
  if (me.identity.teams?.some((t) => t.role === 'author')) return 'Team Author';
  return 'User';
}

export type DepartmentWithTeams = {
  id: string;
  name: string;
  teams: { id: string; name: string }[];
};
export type DepartmentsRes = { items: DepartmentWithTeams[]; total: number };
export type TeamsRes = { items: { id: string; name: string }[]; total: number };

export type AdminUser = {
  id: string;
  name: string;
  email: string | null;
  isAdmin: boolean;
  deletedAt: Date | null;
  role:
    | 'User'
    | 'Team Author'
    | 'Team Lead'
    | 'Department Author'
    | 'Department Lead'
    | 'Company Lead'
    | 'Admin';
};
