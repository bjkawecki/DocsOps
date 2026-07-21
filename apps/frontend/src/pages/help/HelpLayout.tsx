import { Box, Card, Container, Flex, NavLink, Paper, Stack } from '@mantine/core';
import { IconHelp } from '@tabler/icons-react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  useSetAppShellBreadcrumbActions,
  useSetAppShellBreadcrumbs,
} from '../../components/appShell/AppShellBreadcrumbsContext.js';
import { useSetAppShellNavScope } from '../../components/appShell/AppShellNavScopeContext.js';
import { ContentCardWrapper } from '../../components/contexts/cardShared.js';
import { WIDTH_OPEN as DOCUMENT_COMMENTS_WIDTH_OPEN } from '../../components/documents/documentComments/documentCommentsConstants.js';
import { SectionLabel } from '../../components/ui/SectionLabel.js';
import '../DocumentContent.css';
import { ContextWorkspaceLeftColumn } from '../contextWorkspace/contextWorkspaceChrome.js';
import { HELP_TOPIC_ICON_SIZE, HELP_TOPICS } from './helpTopics.js';

/**
 * Invisible right rail – matches open document comments width so the centered
 * reading column lands like the document page (without shifting the topics nav).
 */
const HELP_BALANCE_RAIL_WIDTH = DOCUMENT_COMMENTS_WIDTH_OPEN;

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
    <Container fluid maw={1600} px="md" className="document-page-shell" w="100%">
      <Paper
        withBorder={false}
        p={0}
        radius="md"
        bg="transparent"
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
      >
        <Flex
          direction={{ base: 'column', lg: 'row' }}
          gap="md"
          align="stretch"
          style={{ flex: 1, minHeight: 0 }}
        >
          <ContextWorkspaceLeftColumn data-context-sibling-nav>
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

          <Box className="document-page-reading" style={{ flex: 1, minHeight: 0, minWidth: 0 }}>
            <Box className="document-page-scroll">
              <Card
                withBorder
                className="document-page-card document-content document-content--help"
                w="100%"
                padding={0}
                styles={{
                  root: {
                    padding: '2rem 3rem',
                    background: 'var(--mantine-color-body)',
                    textAlign: 'left',
                  },
                }}
              >
                <Outlet />
              </Card>
            </Box>
          </Box>

          <Box aria-hidden visibleFrom="lg" w={HELP_BALANCE_RAIL_WIDTH} style={{ flexShrink: 0 }} />
        </Flex>
      </Paper>
    </Container>
  );
}
