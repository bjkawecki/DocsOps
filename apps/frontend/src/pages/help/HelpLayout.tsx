import { Box, Container, Flex, NavLink, Stack } from '@mantine/core';
import { IconHelp } from '@tabler/icons-react';
import { useMemo } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  useSetAppShellBreadcrumbActions,
  useSetAppShellBreadcrumbs,
} from '../../components/appShell/AppShellBreadcrumbsContext.js';
import { useSetAppShellNavScope } from '../../components/appShell/AppShellNavScopeContext.js';
import { ContentCardWrapper } from '../../components/contexts/cardShared.js';
import {
  TOGGLE_STRIP_WIDTH,
  WIDTH_OPEN,
} from '../../components/documents/documentComments/documentCommentsConstants.js';
import { DocumentReadingSurface } from '../../components/documents/DocumentReadingSurface.js';
import { ContentSidebarCollapsibleSection } from '../../components/ui/ContentSidebarCollapsibleSection.js';
import { ResponsiveContentNav } from '../../components/ui/ResponsiveContentNav.js';
import '../DocumentContent.css';
import { HELP_TOPIC_GROUPS, HELP_TOPIC_ICON_SIZE } from './helpTopics.js';

/** Same reserved width as the document comments rail (keeps reading column aligned). */
const HELP_BALANCE_RAIL_WIDTH = TOGGLE_STRIP_WIDTH + WIDTH_OPEN;

const navLinkFullWidth = {
  borderRadius: 'var(--mantine-radius-sm)',
  width: '100%',
} as const;

export function HelpLayout() {
  const { t } = useTranslation('shell');
  const { pathname } = useLocation();
  const sectionTitle = t('account.help');

  useSetAppShellBreadcrumbs([
    {
      key: 'help',
      label: sectionTitle,
      icon: <IconHelp size={14} stroke={1.5} />,
    },
  ]);
  useSetAppShellBreadcrumbActions(null);
  useSetAppShellNavScope(null);

  const activeGroupIds = useMemo(() => {
    const ids = new Set<string>();
    for (const group of HELP_TOPIC_GROUPS) {
      if (group.topics.some((topic) => topic.to === pathname)) ids.add(group.id);
    }
    return ids;
  }, [pathname]);

  const nav = (
    <ContentCardWrapper fullHeight={false}>
      <Stack gap="md" component="nav" align="stretch" w="100%" aria-label="Help topics">
        {HELP_TOPIC_GROUPS.map((group) => {
          const GroupIcon = group.icon;
          return (
            <ContentSidebarCollapsibleSection
              key={group.id}
              sectionId={`help:${group.id}`}
              label={group.label}
              icon={<GroupIcon size={HELP_TOPIC_ICON_SIZE} stroke={1.5} />}
              defaultOpen={group.id === 'getting-started'}
              forceOpenWhen={activeGroupIds.has(group.id)}
            >
              {group.topics.map((topic) => {
                const active = pathname === topic.to;
                return (
                  <NavLink
                    key={topic.to}
                    component={Link}
                    to={topic.to}
                    label={topic.label}
                    active={active}
                    aria-current={active ? 'page' : undefined}
                    variant="subtle"
                    style={navLinkFullWidth}
                  />
                );
              })}
            </ContentSidebarCollapsibleSection>
          );
        })}
      </Stack>
    </ContentCardWrapper>
  );

  return (
    <Box className="document-page-shell">
      <Container
        fluid
        maw={1600}
        px="md"
        className="document-page-body"
        style={{ display: 'block' }}
      >
        <ResponsiveContentNav title={sectionTitle} nav={nav}>
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
                  <DocumentReadingSurface>
                    <Outlet />
                  </DocumentReadingSurface>
                </Box>
              </Box>

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
        </ResponsiveContentNav>
      </Container>
    </Box>
  );
}
