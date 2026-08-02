import { Group, Select, Text } from '@mantine/core';
import {
  BROADCAST_PAGE_SIZE_KEY,
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
} from './adminBroadcastConstants.js';

type AdminBroadcastToolbarProps = {
  total: number;
  limit: number;
  onLimitChange: (next: number) => void;
};

export function AdminBroadcastToolbar({ total, limit, onLimitChange }: AdminBroadcastToolbarProps) {
  return (
    <Group mb="md" justify="space-between" wrap="wrap" gap="sm">
      <Text size="sm" c="dimmed">
        {total} sent message(s)
      </Text>
      <Select
        label="Per page"
        size="xs"
        data={PAGE_SIZE_OPTIONS.map((n) => ({ value: String(n), label: String(n) }))}
        value={String(limit)}
        onChange={(value) => {
          const next = Number(value ?? DEFAULT_PAGE_SIZE);
          onLimitChange(next);
          try {
            window.localStorage.setItem(BROADCAST_PAGE_SIZE_KEY, String(next));
          } catch {
            /* ignore */
          }
        }}
        style={{ width: 100 }}
      />
    </Group>
  );
}
