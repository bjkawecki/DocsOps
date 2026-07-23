import { Text, Tooltip, UnstyledButton } from '@mantine/core';
import { IconLayoutSidebarLeftCollapse, IconLayoutSidebarLeftExpand } from '@tabler/icons-react';
import {
  MAIN_NAV_ID,
  SIDEBAR_MINI_ICON_SIZE,
  SIDEBAR_MINI_ITEM_SIZE,
} from './appShellLayoutConstants.js';

type Props = {
  isMiniRail: boolean;
  onToggle: () => void;
};

/** Footer control: Collapse (expanded) / Expand (mini-rail), anchored at bottom like the reference UI. */
export function AppShellSidebarCollapseControl({ isMiniRail, onToggle }: Props) {
  if (isMiniRail) {
    return (
      <Tooltip label="Expand sidebar" position="right" withArrow>
        <UnstyledButton
          className="app-shell-sidebar-collapse-control app-shell-sidebar-collapse-control--mini"
          onClick={onToggle}
          aria-label="Expand sidebar"
          aria-expanded={false}
          aria-controls={MAIN_NAV_ID}
          style={{ width: SIDEBAR_MINI_ITEM_SIZE, height: SIDEBAR_MINI_ITEM_SIZE }}
        >
          <IconLayoutSidebarLeftExpand size={SIDEBAR_MINI_ICON_SIZE} stroke={1.75} />
        </UnstyledButton>
      </Tooltip>
    );
  }

  return (
    <UnstyledButton
      className="app-shell-sidebar-collapse-control"
      onClick={onToggle}
      aria-label="Collapse sidebar to icon rail"
      aria-expanded
      aria-controls={MAIN_NAV_ID}
    >
      <IconLayoutSidebarLeftCollapse size={SIDEBAR_MINI_ICON_SIZE} stroke={1.75} />
      <Text size="sm" fw={500} c="dimmed" component="span">
        Collapse
      </Text>
    </UnstyledButton>
  );
}
