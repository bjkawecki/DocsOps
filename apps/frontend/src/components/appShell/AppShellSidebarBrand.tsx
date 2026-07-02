import { ActionIcon, Text, Tooltip } from '@mantine/core';
import { IconLayoutSidebarLeftCollapse, IconLayoutSidebarLeftExpand } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { DocopsLogo } from './DocopsLogo';
import {
  MAIN_NAV_ID,
  SIDEBAR_MINI_ICON_SIZE,
  SIDEBAR_MINI_ITEM_SIZE,
} from './appShellLayoutConstants.js';

type Props = {
  isMiniRail: boolean;
  showToggle: boolean;
  resolvedColorScheme: 'light' | 'dark';
  onToggle: () => void;
  onNavigate: () => void;
};

export function AppShellSidebarBrand({
  isMiniRail,
  showToggle,
  resolvedColorScheme,
  onToggle,
  onNavigate,
}: Props) {
  if (isMiniRail) {
    return (
      <div className="app-shell-sidebar-brand app-shell-sidebar-brand--mini">
        <Link
          to="/"
          onClick={onNavigate}
          className="app-shell-sidebar-brand-home app-shell-sidebar-brand-home--mini"
          aria-label="DocsOps home"
        >
          <DocopsLogo width={36} height={36} />
        </Link>
        {showToggle ? (
          <ActionIcon
            className="app-shell-sidebar-brand-expand"
            variant="subtle"
            size={SIDEBAR_MINI_ITEM_SIZE}
            title="Expand sidebar"
            onClick={onToggle}
            aria-label="Expand sidebar"
            aria-expanded={false}
            aria-controls={MAIN_NAV_ID}
          >
            <IconLayoutSidebarLeftExpand size={SIDEBAR_MINI_ICON_SIZE} stroke={1.75} />
          </ActionIcon>
        ) : null}
      </div>
    );
  }

  return (
    <div className="app-shell-sidebar-brand">
      <Link
        to="/"
        onClick={onNavigate}
        className="app-shell-sidebar-brand-home app-shell-sidebar-brand-home--expanded"
        aria-label="DocsOps home"
      >
        <DocopsLogo width={40} height={40} />
        <Text component="span">
          <Text
            component="span"
            c={resolvedColorScheme === 'dark' ? 'white' : 'dimmed'}
            style={{ fontWeight: 500, fontSize: '1.5rem', letterSpacing: '-0.05em' }}
          >
            Docs
          </Text>
          <Text
            component="span"
            c="var(--mantine-primary-color-filled)"
            style={{ fontWeight: 500, fontSize: '1.5rem', letterSpacing: '-0.05em' }}
          >
            Ops
          </Text>
        </Text>
      </Link>
      {showToggle ? (
        <Tooltip label="Collapse sidebar" position="right" withArrow>
          <ActionIcon
            className="app-shell-sidebar-brand-collapse"
            variant="subtle"
            size={SIDEBAR_MINI_ITEM_SIZE}
            onClick={onToggle}
            aria-label="Collapse sidebar to icon rail"
            aria-expanded
            aria-controls={MAIN_NAV_ID}
          >
            <IconLayoutSidebarLeftCollapse size={SIDEBAR_MINI_ICON_SIZE} stroke={1.75} />
          </ActionIcon>
        </Tooltip>
      ) : null}
    </div>
  );
}
