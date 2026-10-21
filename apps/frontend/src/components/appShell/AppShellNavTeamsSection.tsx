import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, NavLink, Stack, Text } from '@mantine/core';
import { IconUsersGroup } from '@tabler/icons-react';
import { isOrgNavActive, type AppShellNavLinkStyles } from './appShellNavUtils.js';
import { useAppShellNavScope } from './AppShellNavScopeContext.js';
import { AppShellNavCollapsibleSection } from './AppShellNavCollapsibleSection';
import { AppShellNavCountBadge } from './AppShellNavCountBadge.js';
import { AppShellScopeNavLink } from './AppShellScopeNavLink';

export type AppShellNavTeamItem = {
  id: string;
  name: string;
  /** Optional department label when listing teams across multiple departments. */
  groupLabel?: string;
};

type MenuItem = {
  to: string;
  label: string;
  active: boolean;
  badgeCount: number | undefined;
};

type Props = {
  pathname: string;
  navLinkStyles: AppShellNavLinkStyles;
  teams: AppShellNavTeamItem[];
  teamCounts: Record<string, number>;
  expanded: boolean;
  onToggle: () => void;
  /** When teams come from multiple departments, render group labels in the expanded list. */
  showGroupLabels?: boolean;
  isMiniRail?: boolean;
  onNavigate?: () => void;
};

/**
 * Single-team shortcut or collapsible multi-team section (company lead + department lead nav).
 */
export function AppShellNavTeamsSection({
  pathname,
  navLinkStyles,
  teams,
  teamCounts,
  expanded,
  onToggle,
  showGroupLabels = false,
  isMiniRail = false,
  onNavigate,
}: Props) {
  const { t } = useTranslation('shell');
  const navScope = useAppShellNavScope();
  const singleTeam = teams.length === 1 ? teams[0] : undefined;

  if (singleTeam) {
    return (
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
    );
  }

  const toMenuItem = (team: AppShellNavTeamItem): MenuItem => ({
    to: `/team/${team.id}`,
    label: team.name,
    active: isOrgNavActive(`/team/${team.id}`, pathname, navScope, {
      type: 'team',
      id: team.id,
    }),
    badgeCount: teamCounts[team.id],
  });

  const groups = showGroupLabels
    ? (() => {
        const map = new Map<string, { groupLabel?: string; items: MenuItem[] }>();
        for (const team of teams) {
          const key = team.groupLabel ?? '';
          let group = map.get(key);
          if (!group) {
            group = { groupLabel: team.groupLabel, items: [] };
            map.set(key, group);
          }
          group.items.push(toMenuItem(team));
        }
        return [...map.values()];
      })()
    : [{ items: teams.map(toMenuItem) }];

  return (
    <AppShellNavCollapsibleSection
      label={t('nav.teams')}
      icon={<IconUsersGroup size={20} style={{ flexShrink: 0 }} />}
      expanded={expanded}
      onToggle={onToggle}
      isMiniRail={isMiniRail}
      menuGroups={groups}
      onNavigate={onNavigate}
    >
      <Stack gap={0} pl={0}>
        {showGroupLabels
          ? groups.map((group) => (
              <Box key={group.groupLabel ?? 'default'}>
                {group.groupLabel ? (
                  <Text size="xs" fw={500} c="dimmed" mt="xs" mb={4}>
                    {group.groupLabel}
                  </Text>
                ) : null}
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    data-sidebar-link
                    component={Link}
                    to={item.to}
                    label={item.label}
                    active={item.active}
                    onClick={onNavigate}
                    rightSection={<AppShellNavCountBadge count={item.badgeCount} />}
                    pl="sm"
                    style={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    styles={navLinkStyles}
                  />
                ))}
              </Box>
            ))
          : teams.map((team) => {
              const item = toMenuItem(team);
              return (
                <NavLink
                  key={team.id}
                  data-sidebar-link
                  component={Link}
                  to={item.to}
                  label={item.label}
                  active={item.active}
                  onClick={onNavigate}
                  rightSection={<AppShellNavCountBadge count={item.badgeCount} />}
                  pl="sm"
                  style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                  styles={navLinkStyles}
                />
              );
            })}
      </Stack>
    </AppShellNavCollapsibleSection>
  );
}
