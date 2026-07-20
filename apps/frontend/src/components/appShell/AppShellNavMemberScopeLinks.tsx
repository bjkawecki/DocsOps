import { IconBuildingSkyscraper, IconSitemap, IconUsersGroup } from '@tabler/icons-react';
import { isOrgNavActive } from './appShellNavUtils.js';
import { useAppShellNavScope } from './AppShellNavScopeContext.js';
import { AppShellScopeNavLink } from './AppShellScopeNavLink';

type Props = {
  pathname: string;
  navLinkStyles: { root: Record<string, unknown> };
  userDepartmentId: string | undefined;
  userTeamId: string | undefined;
  companyCount: number | undefined;
  departmentCounts: Record<string, number>;
  teamCounts: Record<string, number>;
  isMiniRail?: boolean;
  onNavigate?: () => void;
};

export function AppShellNavMemberScopeLinks({
  pathname,
  navLinkStyles,
  userDepartmentId,
  userTeamId,
  companyCount,
  departmentCounts,
  teamCounts,
  isMiniRail = false,
  onNavigate,
}: Props) {
  const navScope = useAppShellNavScope();
  const departmentBadge =
    userDepartmentId !== undefined ? departmentCounts[userDepartmentId] : undefined;
  const teamBadge = userTeamId !== undefined ? teamCounts[userTeamId] : undefined;

  const companyActive = isOrgNavActive('/company', pathname, navScope, { type: 'company' });
  const departmentActive = userDepartmentId
    ? isOrgNavActive(`/department/${userDepartmentId}`, pathname, navScope, {
        type: 'department',
        id: userDepartmentId,
      })
    : isOrgNavActive('/department', pathname, navScope, { type: 'department' });
  const teamActive = userTeamId
    ? isOrgNavActive(`/team/${userTeamId}`, pathname, navScope, {
        type: 'team',
        id: userTeamId,
      })
    : isOrgNavActive('/team', pathname, navScope, { type: 'team' });

  return (
    <>
      <AppShellScopeNavLink
        to="/company"
        label="Company"
        active={companyActive}
        leftSection={<IconBuildingSkyscraper size={18} />}
        navLinkStyles={navLinkStyles}
        badgeCount={companyCount}
        isMiniRail={isMiniRail}
        onNavigate={onNavigate}
      />
      <AppShellScopeNavLink
        to={userDepartmentId ? `/department/${userDepartmentId}` : '/department'}
        label="Department"
        active={departmentActive}
        leftSection={<IconSitemap size={18} />}
        navLinkStyles={navLinkStyles}
        badgeCount={departmentBadge}
        isMiniRail={isMiniRail}
        onNavigate={onNavigate}
      />
      <AppShellScopeNavLink
        to={userTeamId ? `/team/${userTeamId}` : '/team'}
        label="Team"
        active={teamActive}
        leftSection={<IconUsersGroup size={18} />}
        navLinkStyles={navLinkStyles}
        badgeCount={teamBadge}
        isMiniRail={isMiniRail}
        onNavigate={onNavigate}
      />
    </>
  );
}
