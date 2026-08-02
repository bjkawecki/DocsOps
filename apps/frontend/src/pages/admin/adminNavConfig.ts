/**
 * Admin primary areas + content-sidebar items (SSoT for nav and redirects).
 */

export type AdminNavItem = {
  to: string;
  label: string;
};

export type AdminNavGroup = {
  id: 'organisation' | 'operations' | 'data' | 'platform';
  label: string;
  /** Base path for the group (index redirects to first item). */
  basePath: string;
  items: readonly AdminNavItem[];
};

export const ADMIN_DEFAULT_PATH = '/admin/organisation/users';

export const adminNavGroups = [
  {
    id: 'organisation',
    label: 'Organisation',
    basePath: '/admin/organisation',
    items: [
      { to: '/admin/organisation/users', label: 'Users' },
      { to: '/admin/organisation/teams', label: 'Teams' },
      { to: '/admin/organisation/departments', label: 'Departments' },
      { to: '/admin/organisation/company', label: 'Company' },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    basePath: '/admin/operations',
    items: [
      { to: '/admin/operations/jobs', label: 'Jobs' },
      { to: '/admin/operations/scheduler', label: 'Scheduler' },
    ],
  },
  {
    id: 'data',
    label: 'Data',
    basePath: '/admin/data',
    items: [
      { to: '/admin/data/backup', label: 'Backup' },
      { to: '/admin/data/migration', label: 'Migration' },
    ],
  },
  {
    id: 'platform',
    label: 'Platform',
    basePath: '/admin/platform',
    items: [
      { to: '/admin/platform/system', label: 'System' },
      { to: '/admin/platform/mail', label: 'Mail' },
      { to: '/admin/platform/broadcast', label: 'Broadcast' },
    ],
  },
] as const satisfies readonly AdminNavGroup[];

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

export function findAdminNavGroup(pathname: string): (typeof adminNavGroups)[number] {
  const match = adminNavGroups.find(
    (g) => pathname === g.basePath || pathname.startsWith(`${g.basePath}/`)
  );
  return match ?? adminNavGroups[0];
}

export function findAdminNavItem(pathname: string): AdminNavItem | null {
  for (const group of adminNavGroups) {
    const item = group.items.find((i) => pathname === i.to || pathname.startsWith(`${i.to}/`));
    if (item) return item;
  }
  return null;
}

export function getAdminGroupDefaultPath(group: (typeof adminNavGroups)[number]): string {
  return group.items[0]?.to ?? ADMIN_DEFAULT_PATH;
}
