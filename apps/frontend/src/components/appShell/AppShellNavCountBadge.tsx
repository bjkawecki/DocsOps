import { Text } from '@mantine/core';

/** Compact count badge for sidebar nav links. */
export function AppShellNavCountBadge({ count }: { count: number | undefined }) {
  if (count === undefined || count <= 0) return null;
  return (
    <Text size="xs" c="var(--mantine-primary-color-filled)" component="span">
      {count}
    </Text>
  );
}
