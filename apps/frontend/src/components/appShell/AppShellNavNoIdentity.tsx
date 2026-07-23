import { IconBuildingSkyscraper, IconSitemap, IconUsersGroup } from '@tabler/icons-react';
import { isOrgNavActive } from './appShellNavUtils.js';
import { useAppShellNavScope } from './AppShellNavScopeContext.js';
import { AppShellScopeNavLink } from './AppShellScopeNavLink';

type Props = {
  pathname: string;
  navLinkStyles: { root: Record<string, unknown> };
  companyCount: number | undefined;
  isMiniRail?: boolean;
  onNavigate?: () => void;
};

export function AppShellNavNoIdentity({
  pathname,
  navLinkStyles,
  companyCount,
  isMiniRail = false,
  onNavigate,
}: Props) {
  const navScope = useAppShellNavScope();
  return (
    <>
      <AppShellScopeNavLink
        to="/company"
        label="Company"
        active={isOrgNavActive('/company', pathname, navScope, { type: 'company' })}
        leftSection={<IconBuildingSkyscraper size={20} />}
        navLinkStyles={navLinkStyles}
        badgeCount={companyCount}
        isMiniRail={isMiniRail}
        onNavigate={onNavigate}
      />
      <AppShellScopeNavLink
        to="/department"
        label="Department"
        active={isOrgNavActive('/department', pathname, navScope, { type: 'department' })}
        leftSection={<IconSitemap size={20} />}
        navLinkStyles={navLinkStyles}
        isMiniRail={isMiniRail}
        onNavigate={onNavigate}
      />
      <AppShellScopeNavLink
        to="/team"
        label="Team"
        active={isOrgNavActive('/team', pathname, navScope, { type: 'team' })}
        leftSection={<IconUsersGroup size={20} />}
        navLinkStyles={navLinkStyles}
        isMiniRail={isMiniRail}
        onNavigate={onNavigate}
      />
    </>
  );
}
