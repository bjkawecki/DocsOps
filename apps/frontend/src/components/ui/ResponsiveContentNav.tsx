import { ActionIcon, Box, Button, Drawer, Flex, Group } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { IconLayoutSidebar } from '@tabler/icons-react';
import { useEffect, type ReactNode, type RefObject } from 'react';
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
  /** Stick left column while scrolling (document chrome). */
  stickyNav?: boolean;
  /**
   * Compact trigger: full button with label (default) or icon-only (document reading).
   */
  compactTrigger?: 'button' | 'icon';
  /** Under compact: omit drawer trigger and drawer (e.g. document edit focus mode). */
  hideCompactTrigger?: boolean;
  /**
   * Under compact: no built-in top trigger; still mounts the drawer and assigns
   * `open` to this ref so a floating action can open the nav.
   */
  compactNavOpenRef?: RefObject<(() => void) | null>;
};

/**
 * Content-first layout: under `compact` (&lt; lg) nav lives in a left drawer;
 * under `wide` the existing two-column chrome is unchanged.
 */
export function ResponsiveContentNav({
  title,
  nav,
  children,
  stickyNav = false,
  compactTrigger = 'button',
  hideCompactTrigger = false,
  compactNavOpenRef,
}: ResponsiveContentNavProps) {
  const { t } = useTranslation('shell');
  const location = useLocation();
  const isWide = useMediaQuery(WIDE_MIN_WIDTH) ?? true;
  const [opened, { open, close }] = useDisclosure(false);

  useEffect(() => {
    close();
  }, [location.pathname, location.search, close]);

  useEffect(() => {
    if (!compactNavOpenRef) return;
    compactNavOpenRef.current = open;
    return () => {
      compactNavOpenRef.current = null;
    };
  }, [compactNavOpenRef, open]);

  if (isWide) {
    return (
      <Flex direction="row" gap="md" align="flex-start" w="100%">
        <ContextWorkspaceLeftColumn data-context-sibling-nav sticky={stickyNav}>
          {nav}
        </ContextWorkspaceLeftColumn>
        <Box style={{ flex: 1, minWidth: 0, width: '100%' }}>{children}</Box>
      </Flex>
    );
  }

  if (hideCompactTrigger) {
    return <Box w="100%">{children}</Box>;
  }

  const aria = t('nav.contentNavOpenAria', { title });
  const useExternalTrigger = compactNavOpenRef != null;

  const drawer = (
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
  );

  if (useExternalTrigger) {
    return (
      <Box w="100%">
        {drawer}
        {children}
      </Box>
    );
  }

  return (
    <Box w="100%">
      <Group mb="xs" gap="sm">
        {compactTrigger === 'icon' ? (
          <ActionIcon
            variant="default"
            size={44}
            onClick={open}
            aria-label={aria}
            title={title}
          >
            <IconLayoutSidebar size={20} stroke={1.5} />
          </ActionIcon>
        ) : (
          <Button
            variant="default"
            size="sm"
            leftSection={<IconLayoutSidebar size={16} stroke={1.5} />}
            onClick={open}
            aria-label={aria}
          >
            {title}
          </Button>
        )}
      </Group>
      {drawer}
      {children}
    </Box>
  );
}
