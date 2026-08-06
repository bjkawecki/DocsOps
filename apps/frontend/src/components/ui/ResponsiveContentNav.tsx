import { Box, Button, Drawer, Flex, Group } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { IconLayoutSidebar } from '@tabler/icons-react';
import { useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { WIDE_MIN_WIDTH } from '../appShell/appShellLayoutConstants.js';
import {
  CONTEXT_WORKSPACE_LEFT_WIDTH,
  ContextWorkspaceLeftColumn,
} from '../../pages/contextWorkspace/contextWorkspaceChrome.js';

type ResponsiveContentNavProps = {
  /** Trigger / drawer title (section name, e.g. Admin). */
  title: string;
  /** Left-column nav content (same tree for drawer and desktop column). */
  nav: ReactNode;
  children: ReactNode;
};

/**
 * Content-first layout: under `compact` (&lt; lg) nav lives in a left drawer;
 * under `wide` the existing two-column chrome is unchanged.
 */
export function ResponsiveContentNav({ title, nav, children }: ResponsiveContentNavProps) {
  const { t } = useTranslation('shell');
  const location = useLocation();
  const isWide = useMediaQuery(WIDE_MIN_WIDTH) ?? true;
  const [opened, { open, close }] = useDisclosure(false);

  useEffect(() => {
    close();
  }, [location.pathname, location.search, close]);

  if (isWide) {
    return (
      <Flex direction="row" gap="md" align="flex-start" w="100%">
        <ContextWorkspaceLeftColumn data-context-sibling-nav>{nav}</ContextWorkspaceLeftColumn>
        <Box style={{ flex: 1, minWidth: 0, width: '100%' }}>{children}</Box>
      </Flex>
    );
  }

  return (
    <Box w="100%">
      <Group mb="sm" gap="sm">
        <Button
          variant="default"
          size="sm"
          leftSection={<IconLayoutSidebar size={16} stroke={1.5} />}
          onClick={open}
          aria-label={t('nav.contentNavOpenAria', { title })}
        >
          {title}
        </Button>
      </Group>
      <Drawer
        opened={opened}
        onClose={close}
        title={title}
        position="left"
        size={CONTEXT_WORKSPACE_LEFT_WIDTH}
        padding="md"
        closeButtonProps={{ 'aria-label': t('nav.contentNavCloseAria', { title }) }}
      >
        {nav}
      </Drawer>
      {children}
    </Box>
  );
}
