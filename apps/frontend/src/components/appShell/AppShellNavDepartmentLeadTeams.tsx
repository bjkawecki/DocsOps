import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { NavLink, Stack, Text } from '@mantine/core';
import { IconBuildingSkyscraper, IconSitemap, IconUsersGroup } from '@tabler/icons-react';
import { isOrgNavActive, type AppShellNavLinkStyles } from './appShellNavUtils.js';
import { useAppShellNavScope } from './AppShellNavScopeContext.js';
import { AppShellNavCollapsibleSection } from './AppShellNavCollapsibleSection';
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
  const singleTeam = teams.length === 1 ? teams[0] : undefined;
  const teamMenuItems = teams.map((team) => ({
    to: `/team/${team.id}`,
    label: team.name,
    active: isOrgNavActive(`/team/${team.id}`, pathname, navScope, {
      type: 'team',
      id: team.id,
    }),
    badgeCount: teamCounts[team.id],
  }));

  return (
    <>
      <AppShellScopeNavLink
        to="/company"
        label={t('nav.company')}
        active={isOrgNavActive('/company', pathname, navScope, { type: 'company' })}
        leftSection={<IconBuildingSkyscraper size={20} />}
        navLinkStyles={navLinkStyles}
        badgeCount={companyCount}
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
      {singleTeam ? (
        <AppShellScopeNavLink
          to={`/team/${singleTeam.id}`}
          label={t('nav.team')}
          active={isOrgNavActive(`/team/${singleTeam.id}`, pathname, navScope, {
            type: 'team',
            id: singleTeam.id,
          })}
          leftSection={<IconUsersGroup size={20} />}
          navLinkStyles={navLinkStyles}
          badgeCount={teamCounts[singleTeam.id]}
          isMiniRail={isMiniRail}
          onNavigate={onNavigate}
        />
      ) : (
        <AppShellNavCollapsibleSection
          label={t('nav.teams')}
          icon={<IconUsersGroup size={20} style={{ flexShrink: 0 }} />}
          expanded={isTeamsExpanded}
          onToggle={toggleTeamsExpanded}
          isMiniRail={isMiniRail}
          menuGroups={[{ items: teamMenuItems }]}
          onNavigate={onNavigate}
        >
          <Stack gap={0} pl={0}>
            {teams.map((team) => (
              <NavLink
                key={team.id}
                data-sidebar-link
                component={Link}
                to={`/team/${team.id}`}
                label={team.name}
                active={isOrgNavActive(`/team/${team.id}`, pathname, navScope, {
                  type: 'team',
                  id: team.id,
                })}
                onClick={onNavigate}
                rightSection={
                  teamCounts[team.id] !== undefined && teamCounts[team.id] > 0 ? (
                    <Text size="xs" c="var(--mantine-primary-color-filled)" component="span">
                      {teamCounts[team.id]}
                    </Text>
                  ) : null
                }
                pl="sm"
                style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                styles={navLinkStyles}
              />
            ))}
          </Stack>
        </AppShellNavCollapsibleSection>
      )}
    </>
  );
}
