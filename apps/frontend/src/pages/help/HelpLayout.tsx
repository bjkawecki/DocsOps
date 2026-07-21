import { Box, Container, Flex, NavLink, Paper, Stack } from '@mantine/core';
import { IconHelp } from '@tabler/icons-react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  useSetAppShellBreadcrumbActions,
  useSetAppShellBreadcrumbs,
} from '../../components/appShell/AppShellBreadcrumbsContext.js';
import { useSetAppShellNavScope } from '../../components/appShell/AppShellNavScopeContext.js';
import { ContentCardWrapper } from '../../components/contexts/cardShared.js';
import { SectionLabel } from '../../components/ui/SectionLabel.js';
import { ContextWorkspaceLeftColumn } from '../contextWorkspace/contextWorkspaceChrome.js';
import { HELP_TOPIC_ICON_SIZE, HELP_TOPICS } from './helpTopics.js';

/** Max width of the help content card (readable line length including padding). */
const HELP_PANEL_MAX_WIDTH = 720;

const navLinkFullWidth = {
  borderRadius: 'var(--mantine-radius-sm)',
  width: '100%',
} as const;

export function HelpLayout() {
  const { pathname } = useLocation();

  useSetAppShellBreadcrumbs([
    {
      key: 'help',
      label: 'Help',
      icon: <IconHelp size={14} stroke={1.5} />,
    },
  ]);
  useSetAppShellBreadcrumbActions(null);
  useSetAppShellNavScope(null);

  return (
    <Container fluid maw={1600} px="md" mb="xl">
      <Paper withBorder={false} p={0} radius="md">
        <Flex direction={{ base: 'column', lg: 'row' }} gap="md" align="flex-start">
          <ContextWorkspaceLeftColumn data-context-sibling-nav sticky>
            <ContentCardWrapper fullHeight={false}>
              <SectionLabel mb="sm">Topics</SectionLabel>
              <Stack component="nav" gap={2} align="stretch" w="100%" aria-label="Help topics">
                {HELP_TOPICS.map((topic) => {
                  const Icon = topic.icon;
                  return (
                    <NavLink
                      key={topic.to}
                      component={Link}
                      to={topic.to}
                      label={topic.label}
                      leftSection={<Icon size={HELP_TOPIC_ICON_SIZE} stroke={1.5} />}
                      active={pathname === topic.to}
                      aria-current={pathname === topic.to ? 'page' : undefined}
                      variant="subtle"
                      style={navLinkFullWidth}
                    />
                  );
                })}
              </Stack>
            </ContentCardWrapper>
          </ContextWorkspaceLeftColumn>

          <Box style={{ flex: 1, minWidth: 0, width: '100%' }}>
            <Box maw={HELP_PANEL_MAX_WIDTH} w="100%">
              <ContentCardWrapper fullHeight={false} padding="lg">
                <Box style={{ textAlign: 'left' }}>
                  <Outlet />
                </Box>
              </ContentCardWrapper>
            </Box>
          </Box>
        </Flex>
      </Paper>
    </Container>
  );
}
