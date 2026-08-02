import { Box, NavLink, Stack } from '@mantine/core';
import {
  IconBuildingSkyscraper,
  IconDatabase,
  IconServer,
  IconSettings,
} from '@tabler/icons-react';
import { useMemo, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ContentCardWrapper } from '../../components/contexts/cardShared.js';
import { ContentSidebarCollapsibleSection } from '../../components/ui/ContentSidebarCollapsibleSection.js';
import { adminNavGroups, findAdminNavGroup } from './adminNavConfig.js';

const ICON_SIZE = 16;

const navLinkFullWidth = {
  borderRadius: 'var(--mantine-radius-sm)',
  width: '100%',
} as const;

function groupIcon(groupId: (typeof adminNavGroups)[number]['id']): ReactNode {
  if (groupId === 'organisation') {
    return <IconBuildingSkyscraper size={ICON_SIZE} stroke={1.5} />;
  }
  if (groupId === 'operations') {
    return <IconServer size={ICON_SIZE} stroke={1.5} />;
  }
  if (groupId === 'data') {
    return <IconDatabase size={ICON_SIZE} stroke={1.5} />;
  }
  return <IconSettings size={ICON_SIZE} stroke={1.5} />;
}

/**
 * Admin content sidebar: primary areas as collapsible sections with page links.
 */
export function AdminContentSidebar() {
  const location = useLocation();
  const activeGroup = findAdminNavGroup(location.pathname);

  const activeGroupIds = useMemo(() => new Set([activeGroup.id]), [activeGroup.id]);

  return (
    <ContentCardWrapper fullHeight={false}>
      <Stack gap="md" component="nav" align="stretch" w="100%" aria-label="Admin">
        {adminNavGroups.map((group) => (
          <ContentSidebarCollapsibleSection
            key={group.id}
            sectionId={`admin:${group.id}`}
            label={group.label}
            icon={groupIcon(group.id)}
            defaultOpen={group.id === 'organisation'}
            forceOpenWhen={activeGroupIds.has(group.id)}
          >
            {group.items.map((item) => {
              const active =
                location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
              return (
                <Box key={item.to} w="100%">
                  <NavLink
                    component={Link}
                    to={item.to}
                    label={item.label}
                    active={active}
                    aria-current={active ? 'page' : undefined}
                    variant="subtle"
                    style={navLinkFullWidth}
                  />
                </Box>
              );
            })}
          </ContentSidebarCollapsibleSection>
        ))}
      </Stack>
    </ContentCardWrapper>
  );
}
