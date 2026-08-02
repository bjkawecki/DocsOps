import { Anchor, Group, Stack, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../api/client.js';
import type { TrashArchiveScope } from '../trashArchive/trashArchiveTypes.js';

export type MostReadItem = {
  id: string;
  title: string;
  viewCount: number;
  contextName: string;
};

type Props = {
  scope: TrashArchiveScope;
  companyId?: string;
  departmentId?: string;
  teamId?: string;
};

/**
 * Lead-only top published documents by all-time reader-days.
 */
export function MostReadListContent({ scope, companyId, departmentId, teamId }: Props) {
  const params = new URLSearchParams({ scope });
  if (scope === 'company' && companyId) params.set('companyId', companyId);
  if (scope === 'department' && departmentId) params.set('departmentId', departmentId);
  if (scope === 'team' && teamId) params.set('teamId', teamId);

  const enabled =
    scope === 'personal' ||
    (scope === 'company' && !!companyId) ||
    (scope === 'department' && !!departmentId) ||
    (scope === 'team' && !!teamId);

  const { data, isPending, isError } = useQuery({
    queryKey: ['me', 'most-read', scope, companyId, departmentId, teamId],
    queryFn: async (): Promise<{ items: MostReadItem[] }> => {
      const res = await apiFetch(`/api/v1/me/most-read?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load most read');
      return (await res.json()) as { items: MostReadItem[] };
    },
    enabled,
  });

  if (!enabled) {
    return (
      <Text size="sm" c="dimmed">
        Scope not available.
      </Text>
    );
  }

  if (isPending) {
    return (
      <Text size="sm" c="dimmed">
        Loading…
      </Text>
    );
  }

  if (isError) {
    return (
      <Text size="sm" c="red">
        Failed to load most read documents.
      </Text>
    );
  }

  const items = data?.items ?? [];
  if (items.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        No reader activity yet.
      </Text>
    );
  }

  return (
    <Stack gap="xs" w="100%">
      <Group justify="space-between" px={4} gap="md">
        <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
          Document
        </Text>
        <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
          Reader-days
        </Text>
      </Group>
      {items.map((item) => (
        <Group key={item.id} justify="space-between" gap="md" wrap="nowrap" px={4}>
          <Stack gap={2} style={{ minWidth: 0, flex: 1 }}>
            <Anchor component={Link} to={`/documents/${item.id}`} size="sm" fw={500} truncate>
              {item.title}
            </Anchor>
            <Text size="xs" c="dimmed" truncate>
              {item.contextName}
            </Text>
          </Stack>
          <Text
            size="sm"
            c="dimmed"
            style={{ flexShrink: 0 }}
            aria-label={`${item.viewCount} reader-days`}
          >
            {item.viewCount}
          </Text>
        </Group>
      ))}
    </Stack>
  );
}
