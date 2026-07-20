import { Anchor, Box, Breadcrumbs, Divider, Group, Text } from '@mantine/core';
import { IconChevronRight } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useAppShellBreadcrumbItems } from './AppShellBreadcrumbsContext.js';

/** Meter-style breadcrumb row under the top bar; renders nothing when empty. */
export function AppShellBreadcrumbBar() {
  const items = useAppShellBreadcrumbItems();
  if (items == null || items.length === 0) return null;

  return (
    <Box mb="sm">
      <Breadcrumbs
        separator={<IconChevronRight size={14} color="var(--mantine-color-dimmed)" />}
        mb={6}
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
              <Anchor key={item.key} component={Link} to={item.to} c="dimmed" size="sm">
                {content}
              </Anchor>
            );
          }
          return (
            <Text key={item.key} size="sm" c="dimmed" component="span">
              {content}
            </Text>
          );
        })}
      </Breadcrumbs>
      <Divider />
    </Box>
  );
}
