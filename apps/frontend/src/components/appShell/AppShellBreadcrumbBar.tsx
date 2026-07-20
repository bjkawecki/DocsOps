import { Anchor, Box, Breadcrumbs, Divider, Group, Text } from '@mantine/core';
import { IconChevronRight } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import {
  useAppShellBreadcrumbActions,
  useAppShellBreadcrumbItems,
} from './AppShellBreadcrumbsContext.js';

/** Meter-style breadcrumb row under the top bar; renders nothing when empty. */
export function AppShellBreadcrumbBar() {
  const items = useAppShellBreadcrumbItems();
  const actions = useAppShellBreadcrumbActions();
  const hasItems = items != null && items.length > 0;
  if (!hasItems && actions == null) return null;

  return (
    <Box mb="sm" className="app-shell-breadcrumb-bar">
      <Group
        className="app-shell-breadcrumb-row"
        justify="space-between"
        align="center"
        gap="sm"
        wrap="nowrap"
        mb={6}
      >
        {hasItems ? (
          <Breadcrumbs
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
          <Box style={{ flex: 1, minWidth: 0 }} />
        )}
        <Box className="app-shell-breadcrumb-actions" style={{ flexShrink: 0 }}>
          {actions}
        </Box>
      </Group>
      <Divider />
    </Box>
  );
}
