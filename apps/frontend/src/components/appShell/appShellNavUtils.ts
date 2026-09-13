import type { DisplayRoleKey } from '../../lib/orgRoleLabel.js';

export function isActive(path: string, current: string): boolean {
  if (path === '/') return current === '/';
  return current === path || current.startsWith(path + '/');
}

/**
 * Org/Personal/Shared sidebar link is active on its own route or when the
 * current content owner scope (process/project/document) matches this link.
 */
export function isOrgNavActive(
  path: string,
  pathname: string,
  navScope: { type: string; id?: string } | null,
  linkScope: { type: string; id?: string }
): boolean {
  if (isActive(path, pathname)) return true;
  if (navScope == null || navScope.type !== linkScope.type) return false;
  if (linkScope.id != null) {
    return navScope.id === linkScope.id;
  }
  return true;
}

export type AppShellNavLinkStyles = {
  root: Record<string, unknown>;
  label: Record<string, unknown>;
};

/** Shared styles for app-shell sidebar nav links (heavier weight than content sidebars). */
export function getNavLinkStyles(): AppShellNavLinkStyles {
  return {
    root: {
      borderRadius: 'var(--mantine-radius-sm)',
      padding: '4px 8px',
      minHeight: 32,
      fontSize: 'var(--mantine-font-size-md)',
    },
    label: {
      fontSize: 'var(--mantine-font-size-md)',
      fontWeight: 600,
    },
  };
}

/** Capability display key from MeResponse (Admin > leads > authors > user). */
export function getDisplayRoleKey(me: {
  user: { isAdmin: boolean };
  identity: {
    companyLeads: unknown[];
    departmentLeads: unknown[];
    departmentAuthors?: unknown[];
    teams: { role: string }[];
  };
}): DisplayRoleKey {
  if (me.user.isAdmin) return 'admin';
  if ((me.identity.companyLeads?.length ?? 0) > 0) return 'companyLead';
  if ((me.identity.departmentLeads?.length ?? 0) > 0) return 'departmentLead';
  if ((me.identity.departmentAuthors?.length ?? 0) > 0) return 'departmentAuthor';
  if (me.identity.teams?.some((t) => t.role === 'leader')) return 'teamLead';
  if (me.identity.teams?.some((t) => t.role === 'author')) return 'teamAuthor';
  return 'user';
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
