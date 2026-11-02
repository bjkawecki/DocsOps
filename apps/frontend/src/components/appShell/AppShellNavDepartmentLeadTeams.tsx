import { useTranslation } from 'react-i18next';
import { IconSitemap } from '@tabler/icons-react';
import { isOrgNavActive, type AppShellNavLinkStyles } from './appShellNavUtils.js';
import { useAppShellNavScope } from './AppShellNavScopeContext.js';
import { AppShellNavCompanyLink } from './AppShellNavCompanyLink.js';
import { AppShellNavTeamsSection } from './AppShellNavTeamsSection.js';
import { AppShellScopeNavLink } from './AppShellScopeNavLink';

type TeamItem = { id: string; name: string };

type Props = {
  pathname: string;
  navLinkStyles: AppShellNavLinkStyles;
  departmentId: string;
  teams: TeamItem[];
  companyCount: number | undefined;
  departmentCounts: Record<string, number>;
  teamCounts: Record<string, number>;
  isTeamsExpanded: boolean;
  toggleTeamsExpanded: () => void;
  isMiniRail?: boolean;
  onNavigate?: () => void;
};

export function AppShellNavDepartmentLeadTeams({
  pathname,
  navLinkStyles,
  departmentId,
  teams,
  companyCount,
  departmentCounts,
  teamCounts,
  isTeamsExpanded,
  toggleTeamsExpanded,
  isMiniRail = false,
  onNavigate,
}: Props) {
  const { t } = useTranslation('shell');
  const navScope = useAppShellNavScope();

  return (
    <>
      <AppShellNavCompanyLink
        pathname={pathname}
        navLinkStyles={navLinkStyles}
        companyCount={companyCount}
        isMiniRail={isMiniRail}
        onNavigate={onNavigate}
      />
      <AppShellScopeNavLink
        to={`/department/${departmentId}`}
        label={t('nav.department')}
        active={isOrgNavActive(`/department/${departmentId}`, pathname, navScope, {
          type: 'department',
          id: departmentId,
        })}
        leftSection={<IconSitemap size={20} />}
        navLinkStyles={navLinkStyles}
        badgeCount={departmentCounts[departmentId]}
        isMiniRail={isMiniRail}
        onNavigate={onNavigate}
      />
      <AppShellNavTeamsSection
        pathname={pathname}
        navLinkStyles={navLinkStyles}
        teams={teams}
        teamCounts={teamCounts}
        expanded={isTeamsExpanded}
        onToggle={toggleTeamsExpanded}
        isMiniRail={isMiniRail}
        onNavigate={onNavigate}
      />
    </>
  );
}
