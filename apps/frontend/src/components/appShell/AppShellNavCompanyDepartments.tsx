import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { NavLink, Stack } from '@mantine/core';
import { IconSitemap } from '@tabler/icons-react';
import type { AppShellNavLinkStyles, DepartmentWithTeams } from './appShellNavUtils.js';
import { isOrgNavActive } from './appShellNavUtils.js';
import { useAppShellNavScope } from './AppShellNavScopeContext.js';
import { AppShellNavCollapsibleSection } from './AppShellNavCollapsibleSection';
import { AppShellNavCompanyLink } from './AppShellNavCompanyLink.js';
import { AppShellNavCountBadge } from './AppShellNavCountBadge.js';
import { AppShellNavTeamsSection } from './AppShellNavTeamsSection.js';
import { AppShellScopeNavLink } from './AppShellScopeNavLink';

type Props = {
  pathname: string;
  navLinkStyles: AppShellNavLinkStyles;
  depts: DepartmentWithTeams[];
  companyCount: number | undefined;
  departmentCounts: Record<string, number>;
  teamCounts: Record<string, number>;
  departmentsSectionExpanded: boolean;
  setDepartmentsSectionExpanded: (v: boolean | ((p: boolean) => boolean)) => void;
  teamsSectionExpanded: boolean;
  setTeamsSectionExpanded: (v: boolean | ((p: boolean) => boolean)) => void;
  isMiniRail?: boolean;
  onNavigate?: () => void;
};

export function AppShellNavCompanyDepartments({
  pathname,
  navLinkStyles,
  depts,
  companyCount,
  departmentCounts,
  teamCounts,
  departmentsSectionExpanded,
  setDepartmentsSectionExpanded,
  teamsSectionExpanded,
  setTeamsSectionExpanded,
  isMiniRail = false,
  onNavigate,
}: Props) {
  const { t } = useTranslation('shell');
  const navScope = useAppShellNavScope();
  const singleDept = depts.length === 1 ? depts[0] : undefined;

  const departmentMenuItems = depts.map((dept) => ({
    to: `/department/${dept.id}`,
    label: dept.name,
    active: isOrgNavActive(`/department/${dept.id}`, pathname, navScope, {
      type: 'department',
      id: dept.id,
    }),
    badgeCount: departmentCounts[dept.id],
  }));

  const flatTeams = depts.flatMap((dept) =>
    (dept.teams ?? []).map((team) => ({
      id: team.id,
      name: team.name,
      groupLabel: depts.length > 1 ? dept.name : undefined,
    }))
  );

  return (
    <>
      <AppShellNavCompanyLink
        pathname={pathname}
        navLinkStyles={navLinkStyles}
        companyCount={companyCount}
        isMiniRail={isMiniRail}
        onNavigate={onNavigate}
      />
      {singleDept ? (
        <AppShellScopeNavLink
          to={`/department/${singleDept.id}`}
          label={t('nav.department')}
          active={isOrgNavActive(`/department/${singleDept.id}`, pathname, navScope, {
            type: 'department',
            id: singleDept.id,
          })}
          leftSection={<IconSitemap size={20} />}
          navLinkStyles={navLinkStyles}
          badgeCount={departmentCounts[singleDept.id]}
          isMiniRail={isMiniRail}
          onNavigate={onNavigate}
        />
      ) : (
        <AppShellNavCollapsibleSection
          label={t('nav.departments')}
          icon={<IconSitemap size={20} style={{ flexShrink: 0 }} />}
          expanded={departmentsSectionExpanded}
          onToggle={() => setDepartmentsSectionExpanded((v) => !v)}
          isMiniRail={isMiniRail}
          menuGroups={[{ items: departmentMenuItems }]}
          onNavigate={onNavigate}
        >
          <Stack gap={0} pl={0}>
            {depts.map((dept) => (
              <NavLink
                key={dept.id}
                data-sidebar-link
                component={Link}
                to={`/department/${dept.id}`}
                label={dept.name}
                active={isOrgNavActive(`/department/${dept.id}`, pathname, navScope, {
                  type: 'department',
                  id: dept.id,
                })}
                onClick={onNavigate}
                rightSection={<AppShellNavCountBadge count={departmentCounts[dept.id]} />}
                style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                styles={navLinkStyles}
              />
            ))}
          </Stack>
        </AppShellNavCollapsibleSection>
      )}
      <AppShellNavTeamsSection
        pathname={pathname}
        navLinkStyles={navLinkStyles}
        teams={flatTeams}
        teamCounts={teamCounts}
        expanded={teamsSectionExpanded}
        onToggle={() => setTeamsSectionExpanded((v) => !v)}
        showGroupLabels={depts.length > 1}
        isMiniRail={isMiniRail}
        onNavigate={onNavigate}
      />
    </>
  );
}
