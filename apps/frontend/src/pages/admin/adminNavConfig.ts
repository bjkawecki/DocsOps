/**
 * Admin primary areas + content-sidebar items (SSoT for nav and redirects).
 * Labels: i18n keys under namespace `admin` (e.g. nav.users).
 */

export type AdminNavItem = {
  to: string;
  labelKey: string;
};

export type AdminNavGroup = {
  id: 'organisation' | 'operations' | 'data' | 'platform';
  labelKey: string;
  /** Base path for the group (index redirects to first item). */
  basePath: string;
  items: readonly AdminNavItem[];
};

export const ADMIN_DEFAULT_PATH = '/admin/organisation/users';

export const adminNavGroups = [
  {
    id: 'organisation',
    labelKey: 'nav.organisation',
    basePath: '/admin/organisation',
    items: [
      { to: '/admin/organisation/users', labelKey: 'nav.users' },
      { to: '/admin/organisation/teams', labelKey: 'nav.teams' },
      { to: '/admin/organisation/departments', labelKey: 'nav.departments' },
      { to: '/admin/organisation/company', labelKey: 'nav.company' },
    ],
  },
  {
    id: 'operations',
    labelKey: 'nav.operations',
    basePath: '/admin/operations',
    items: [
      { to: '/admin/operations/jobs', labelKey: 'nav.jobs' },
      { to: '/admin/operations/scheduler', labelKey: 'nav.scheduler' },
    ],
  },
  {
    id: 'data',
    labelKey: 'nav.data',
    basePath: '/admin/data',
    items: [
      { to: '/admin/data/backup', labelKey: 'nav.backup' },
      { to: '/admin/data/migration', labelKey: 'nav.migration' },
    ],
  },
  {
    id: 'platform',
    labelKey: 'nav.platform',
    basePath: '/admin/platform',
    items: [
      { to: '/admin/platform/system', labelKey: 'nav.system' },
      { to: '/admin/platform/mail', labelKey: 'nav.mail' },
      { to: '/admin/platform/broadcast', labelKey: 'nav.broadcast' },
    ],
  },
] as const satisfies readonly AdminNavGroup[];

/** Demo mode: hide mutating admin areas (backup, migration, mail, broadcast). */
export function getAdminNavGroups(demoMode: boolean): readonly AdminNavGroup[] {
  if (!demoMode) return adminNavGroups;
  return adminNavGroups
    .filter((g) => g.id !== 'data')
    .map((g) => {
      if (g.id !== 'platform') return g;
      return {
        ...g,
        items: g.items.filter((item) => item.to === '/admin/platform/system'),
      };
    });
}

/** Legacy flat paths → nested paths (bookmarks / deep links). */
export const adminLegacyRedirects: ReadonlyArray<{ from: string; to: string }> = [
  { from: 'users', to: '/admin/organisation/users' },
  { from: 'teams', to: '/admin/organisation/teams' },
  { from: 'departments', to: '/admin/organisation/departments' },
  { from: 'company', to: '/admin/organisation/company' },
  { from: 'jobs', to: '/admin/operations/jobs' },
  { from: 'scheduler', to: '/admin/operations/scheduler' },
  { from: 'backup', to: '/admin/data/backup' },
  { from: 'migration', to: '/admin/data/migration' },
  { from: 'broadcast', to: '/admin/platform/broadcast' },
  { from: 'system', to: '/admin/platform/system' },
];

export function findAdminNavGroup(
  pathname: string,
  groups: readonly AdminNavGroup[] = adminNavGroups
): AdminNavGroup {
  const match = groups.find(
    (g) => pathname === g.basePath || pathname.startsWith(`${g.basePath}/`)
  );
  return match ?? groups[0] ?? adminNavGroups[0];
}

export function findAdminNavItem(
  pathname: string,
  groups: readonly AdminNavGroup[] = adminNavGroups
): AdminNavItem | null {
  for (const group of groups) {
    const item = group.items.find((i) => pathname === i.to || pathname.startsWith(`${i.to}/`));
    if (item) return item;
  }
  return null;
}

export function getAdminGroupDefaultPath(group: AdminNavGroup): string {
  return group.items[0]?.to ?? ADMIN_DEFAULT_PATH;
}
