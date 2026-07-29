import { Box, Card, Container, Flex, Stack, Text } from '@mantine/core';
import { IconHelp } from '@tabler/icons-react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  useSetAppShellBreadcrumbActions,
  useSetAppShellBreadcrumbs,
} from '../../components/appShell/AppShellBreadcrumbsContext.js';
import { useSetAppShellNavScope } from '../../components/appShell/AppShellNavScopeContext.js';
import {
  TOGGLE_STRIP_WIDTH,
  WIDTH_OPEN,
} from '../../components/documents/documentComments/documentCommentsConstants.js';
import '../DocumentContent.css';
import {
  CONTEXT_WORKSPACE_LEFT_WIDTH,
  ContextWorkspaceLeftColumn,
} from '../contextWorkspace/contextWorkspaceChrome.js';
import { DocumentChromeCollapsiblePanel } from '../documentPage/DocumentChromeCollapsiblePanel.js';
import { HELP_TOPIC_ICON_SIZE, HELP_TOPICS } from './helpTopics.js';

/** Same reserved width as the document comments rail (keeps reading column aligned). */
const HELP_BALANCE_RAIL_WIDTH = TOGGLE_STRIP_WIDTH + WIDTH_OPEN;

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
    <Box className="document-page-shell">
      {/* Same inset as DocumentPageLoadedLayout (`Container fluid maw={1600} px="md"`). */}
      <Container
        fluid
        maw={1600}
        px="md"
        className="document-page-body"
        style={{ display: 'flex' }}
      >
        <Box className="document-page-left" w={{ base: '100%', lg: CONTEXT_WORKSPACE_LEFT_WIDTH }}>
          <Box className="document-page-left-inner">
            <ContextWorkspaceLeftColumn data-context-sibling-nav>
              <Stack gap="md" w="100%">
                <DocumentChromeCollapsiblePanel sectionId="help:topics" title="Topics" defaultOpen>
                  <Stack component="nav" gap={4} align="stretch" w="100%" aria-label="Help topics">
                    {HELP_TOPICS.map((topic) => {
                      const Icon = topic.icon;
                      const active = pathname === topic.to;
                      return (
                        <Text
                          key={topic.to}
                          component={Link}
                          to={topic.to}
                          className="document-chrome-nav-link"
                          aria-current={active ? 'page' : undefined}
                          fw={active ? 600 : undefined}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            whiteSpace: 'normal',
                          }}
                        >
                          <Icon size={HELP_TOPIC_ICON_SIZE} stroke={1.5} aria-hidden />
                          {topic.label}
                        </Text>
                      );
                    })}
                  </Stack>
                </DocumentChromeCollapsiblePanel>
              </Stack>
            </ContextWorkspaceLeftColumn>
          </Box>
        </Box>

        <Box className="document-page-main">
          <Flex
            gap={{ base: 'lg', lg: 'xl' }}
            direction={{ base: 'column', lg: 'row' }}
            align={{ base: 'stretch', lg: 'stretch' }}
            wrap="nowrap"
            w="100%"
            style={{ overflow: 'visible' }}
          >
            <Box className="document-page-reading">
              <Box className="document-page-scroll">
                <Card
                  className="document-page-card document-content document-content--help"
                  w="100%"
                  padding={0}
                  styles={{
                    root: {
                      padding: '0 0 2rem',
                      background: 'transparent',
                      textAlign: 'left',
                      overflow: 'visible',
                    },
                  }}
                >
                  <Outlet />
                </Card>
              </Box>
            </Box>

            {/*
              Invisible spacer matching the document comments rail width so the
              reading column (and page scrollbar edge) align with document pages.
            */}
            <Box
              component="aside"
              aria-hidden
              className="document-page-comments-aside"
              visibleFrom="lg"
              style={{
                flexShrink: 0,
                width: HELP_BALANCE_RAIL_WIDTH,
                minWidth: HELP_BALANCE_RAIL_WIDTH,
                maxWidth: HELP_BALANCE_RAIL_WIDTH,
              }}
            />
          </Flex>
        </Box>
      </Container>
    </Box>
  );
}
