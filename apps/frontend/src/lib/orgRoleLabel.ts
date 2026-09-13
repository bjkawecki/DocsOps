import type { OrgRoleKey, OrgRoleLabels } from 'backend/api-types';

export type { OrgRoleKey, OrgRoleLabels };

export const ORG_ROLE_KEYS = [
  'companyLead',
  'departmentLead',
  'teamLead',
  'teamMember',
] as const satisfies readonly OrgRoleKey[];

export type OrgRoleForm = 'singular' | 'plural';

/** Roles that are not org-label configurable but still need display strings. */
export type ExtraDisplayRoleKey = 'admin' | 'departmentAuthor' | 'teamAuthor' | 'user';

export type DisplayRoleKey = OrgRoleKey | ExtraDisplayRoleKey;

const LEGACY_USER_ROLE_TO_KEY: Record<string, DisplayRoleKey> = {
  Admin: 'admin',
  'Company Lead': 'companyLead',
  'Department Lead': 'departmentLead',
  'Department Author': 'departmentAuthor',
  'Team Lead': 'teamLead',
  'Team Author': 'teamAuthor',
  User: 'user',
  Member: 'teamMember',
};

const DEMO_LOGIN_TO_KEY: Record<string, DisplayRoleKey> = {
  admin: 'admin',
  companyLead: 'companyLead',
  departmentLead: 'departmentLead',
  teamLead: 'teamLead',
  member: 'teamMember',
};

const TEAM_SCOPE_TO_KEY: Record<string, DisplayRoleKey> = {
  leader: 'teamLead',
  lead: 'teamLead',
  author: 'teamAuthor',
  member: 'teamMember',
};

export function isOrgRoleKey(key: string): key is OrgRoleKey {
  return (ORG_ROLE_KEYS as readonly string[]).includes(key);
}

/** Normalize admin UserRole strings, demo keys, or scope team roles to a display key. */
export function toDisplayRoleKey(raw: string): DisplayRoleKey {
  if (isOrgRoleKey(raw)) return raw;
  const legacy = LEGACY_USER_ROLE_TO_KEY[raw];
  if (legacy) return legacy;
  const demo = DEMO_LOGIN_TO_KEY[raw];
  if (demo) return demo;
  const team = TEAM_SCOPE_TO_KEY[raw];
  if (team) return team;
  return 'user';
}

type TranslateFn = (key: string) => string;

function i18nDefault(t: TranslateFn, key: DisplayRoleKey, form: OrgRoleForm): string {
  if (isOrgRoleKey(key)) {
    return t(`orgRoles.${key}.${form}`);
  }
  switch (key) {
    case 'admin':
      return t('orgRolesExtra.admin');
    case 'departmentAuthor':
      return t('orgRolesExtra.departmentAuthor');
    case 'teamAuthor':
      return t('orgRolesExtra.teamAuthor');
    case 'user':
    default:
      return t('orgRolesExtra.user');
  }
}

/**
 * Resolve a role label. Overrides are instance-wide (monolingual); empty → i18n default.
 */
export function resolveOrgRoleLabel(
  t: TranslateFn,
  _locale: string,
  labels: OrgRoleLabels | undefined,
  role: string,
  options?: { count?: number }
): string {
  const key = isOrgRoleKey(role) ? role : toDisplayRoleKey(role);
  const form: OrgRoleForm = options?.count != null && options.count !== 1 ? 'plural' : 'singular';

  if (isOrgRoleKey(key)) {
    const override = labels?.[key]?.[form]?.trim();
    if (override) return override;
    return i18nDefault(t, key, form);
  }

  return i18nDefault(t, key, form);
}
