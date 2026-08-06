import { Anchor, Box, Breadcrumbs, Divider, Group, Text } from '@mantine/core';
import { IconChevronRight } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  useAppShellBreadcrumbActions,
  useAppShellBreadcrumbItems,
  useAppShellChromeBar,
} from './AppShellBreadcrumbsContext.js';

function BreadcrumbActionsSlot({ actions }: { actions: ReactNode }) {
  if (actions == null) return null;
  return <Box className="app-shell-breadcrumb-actions">{actions}</Box>;
}

/** Meter-style chrome row under the top bar; renders nothing when empty. */
export function AppShellBreadcrumbBar() {
  const chromeBar = useAppShellChromeBar();
  const items = useAppShellBreadcrumbItems();
  const actions = useAppShellBreadcrumbActions();
  const hasItems = items != null && items.length > 0;

  if (chromeBar != null) {
    return (
      <Box mb="lg" className="app-shell-breadcrumb-bar">
        <Group
          className="app-shell-breadcrumb-row"
          justify="space-between"
          align="center"
          gap="sm"
          wrap="wrap"
          mb={6}
        >
          <Box className="app-shell-breadcrumb-primary" style={{ flex: 1, minWidth: 0 }}>
            {chromeBar}
          </Box>
          <BreadcrumbActionsSlot actions={actions} />
        </Group>
        <Divider />
      </Box>
    );
  }

  if (!hasItems && actions == null) return null;

  return (
    <Box mb="lg" className="app-shell-breadcrumb-bar">
      <Group
        className="app-shell-breadcrumb-row"
        justify="space-between"
        align="center"
        gap="sm"
        wrap="wrap"
        mb={6}
      >
        {hasItems ? (
          <Breadcrumbs
            className="app-shell-breadcrumb-primary"
            separator={<IconChevronRight size={14} color="var(--mantine-color-dimmed)" />}
            style={{ flex: 1, minWidth: 0 }}
          >
            {items.map((item, index) => {
              const isLast = index === items.length - 1;
              const content = (
                <Group gap={4} align="center" wrap="nowrap">
                  {item.icon}
                  <span>{item.label}</span>
                </Group>
              );
              if (item.to && !isLast) {
                return (
                  <Anchor key={item.key} component={Link} to={item.to} c="dimmed" size="sm">
                    {content}
                  </Anchor>
                );
              }
              if (item.to && isLast) {
                return (
                  <Anchor
                    key={item.key}
                    component={Link}
                    to={item.to}
                    c="var(--mantine-color-text)"
                    size="sm"
                    fw={600}
                  >
                    {content}
                  </Anchor>
                );
              }
              return (
                <Text
                  key={item.key}
                  size="sm"
                  c="var(--mantine-color-text)"
                  fw={600}
                  component="span"
                >
                  {content}
                </Text>
              );
            })}
          </Breadcrumbs>
        ) : (
          <Box className="app-shell-breadcrumb-primary" style={{ flex: 1, minWidth: 0 }} />
        )}
        <BreadcrumbActionsSlot actions={actions} />
      </Group>
      <Divider />
    </Box>
  );
}
