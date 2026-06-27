import { Alert, Box, Button, Group, MultiSelect, Stack, Text } from '@mantine/core';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { apiFetch } from '../../api/client';
import { scopeToUrl } from '../../lib/scopeNav';

type GrantsResponse = {
  users: { userId: string; role: 'Read' | 'Write' }[];
  teams: { teamId: string; role: 'Read' | 'Write' }[];
  departments: { departmentId: string; role: 'Read' | 'Write' }[];
};

type ReadCandidatesResponse = {
  teams: { id: string; name: string; departmentName: string }[];
  departments: { id: string; name: string }[];
};

type DocumentScope =
  | { type: 'team'; id: string }
  | { type: 'department'; id: string }
  | { type: 'company'; id: string }
  | { type: 'personal' }
  | null;

type Props = {
  documentId: string;
  canEditAccess: boolean;
  documentScope: DocumentScope;
};

function sorted(list: string[]): string[] {
  return [...list].sort((a, b) => a.localeCompare(b));
}

function scopeAuthorsHref(scope: DocumentScope): string | null {
  if (scope == null) return null;
  if (scope.type === 'personal') return null;
  return scopeToUrl(scope);
}

export function DocumentAccessPanel({ documentId, canEditAccess, documentScope }: Props) {
  const queryClient = useQueryClient();
  const [teamReadIds, setTeamReadIds] = useState<string[]>([]);
  const [departmentReadIds, setDepartmentReadIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const grantsQuery = useQuery({
    queryKey: ['document', documentId, 'grants'],
    queryFn: async () => {
      const res = await apiFetch(`/api/v1/documents/${documentId}/grants`);
      if (!res.ok) throw new Error('Failed to load document access.');
      return (await res.json()) as GrantsResponse;
    },
    enabled: !!documentId,
  });

  const candidatesQuery = useQuery<ReadCandidatesResponse>({
    queryKey: ['document', documentId, 'access', 'read-candidates'],
    queryFn: async () => {
      const res = await apiFetch(`/api/v1/documents/${documentId}/grants/read-candidates`);
      if (!res.ok) throw new Error('Failed to load read grant candidates.');
      return (await res.json()) as ReadCandidatesResponse;
    },
    enabled: !!documentId,
  });

  const teamOptions = useMemo(
    () =>
      (candidatesQuery.data?.teams ?? []).map((t) => ({
        value: t.id,
        label: `${t.name} (${t.departmentName})`,
      })),
    [candidatesQuery.data]
  );

  const departmentOptions = useMemo(
    () =>
      (candidatesQuery.data?.departments ?? []).map((d) => ({
        value: d.id,
        label: d.name,
      })),
    [candidatesQuery.data]
  );

  useEffect(() => {
    const grants = grantsQuery.data;
    if (!grants) return;
    setTeamReadIds(sorted(grants.teams.filter((g) => g.role === 'Read').map((g) => g.teamId)));
    setDepartmentReadIds(
      sorted(grants.departments.filter((g) => g.role === 'Read').map((g) => g.departmentId))
    );
  }, [grantsQuery.data]);

  const dirty = useMemo(() => {
    const grants = grantsQuery.data;
    if (!grants) return false;
    const teamsServer = sorted(grants.teams.filter((g) => g.role === 'Read').map((g) => g.teamId));
    const deptsServer = sorted(
      grants.departments.filter((g) => g.role === 'Read').map((g) => g.departmentId)
    );
    return (
      JSON.stringify(teamsServer) !== JSON.stringify(sorted(teamReadIds)) ||
      JSON.stringify(deptsServer) !== JSON.stringify(sorted(departmentReadIds))
    );
  }, [grantsQuery.data, teamReadIds, departmentReadIds]);

  const authorsHref = scopeAuthorsHref(documentScope);

  const save = async () => {
    if (!canEditAccess) return;
    const grants = grantsQuery.data;
    if (!grants) return;
    setSaving(true);
    try {
      const userRead = grants.users.filter((g) => g.role === 'Read').map((g) => g.userId);
      const userPayload = {
        grants: sorted([...new Set(userRead)]).map((userId) => ({ userId, role: 'Read' as const })),
      };
      const teamPayload = {
        grants: sorted([...new Set(teamReadIds)]).map((teamId) => ({
          teamId,
          role: 'Read' as const,
        })),
      };
      const departmentPayload = {
        grants: sorted([...new Set(departmentReadIds)]).map((departmentId) => ({
          departmentId,
          role: 'Read' as const,
        })),
      };

      const [ru, rt, rd] = await Promise.all([
        apiFetch(`/api/v1/documents/${documentId}/grants/users`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userPayload),
        }),
        apiFetch(`/api/v1/documents/${documentId}/grants/teams`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(teamPayload),
        }),
        apiFetch(`/api/v1/documents/${documentId}/grants/departments`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(departmentPayload),
        }),
      ]);
      if (!ru.ok || !rt.ok || !rd.ok) {
        const body = (await rt.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? 'Failed to persist access settings.');
      }

      await queryClient.invalidateQueries({ queryKey: ['document', documentId, 'grants'] });
      await queryClient.invalidateQueries({ queryKey: ['document', documentId] });
      notifications.show({
        color: 'green',
        message: 'Access rules updated.',
      });
    } catch (error) {
      notifications.show({
        color: 'red',
        message: error instanceof Error ? error.message : 'Could not update access rules.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (grantsQuery.isPending) {
    return (
      <Text size="sm" c="dimmed">
        Loading access rules...
      </Text>
    );
  }
  if (grantsQuery.isError || !grantsQuery.data) {
    return (
      <Alert color="red" title="Error">
        Access rules could not be loaded.
      </Alert>
    );
  }

  return (
    <Stack gap="md">
      {!canEditAccess && (
        <Alert color="gray" variant="filled" title="Read-only">
          You can review access settings but cannot modify them.
        </Alert>
      )}

      <Alert color="blue" variant="light" title="Authors">
        Document authors are managed at scope level (team or department), not per document.
        {authorsHref ? (
          <>
            {' '}
            <Text component={Link} to={authorsHref} size="sm" fw={500}>
              Open scope page
            </Text>
          </>
        ) : null}
      </Alert>

      {candidatesQuery.isError && (
        <Alert color="yellow" title="Candidate list unavailable">
          Cross-scope read candidates could not be loaded.
        </Alert>
      )}

      <Box>
        <MultiSelect
          label="Team read access"
          description="Grant read access to external teams outside this document owner scope."
          placeholder={canEditAccess ? 'Select teams' : 'Read access is read-only'}
          data={teamOptions}
          value={teamReadIds}
          onChange={setTeamReadIds}
          searchable
          clearable
          disabled={!canEditAccess || candidatesQuery.isPending}
          nothingFoundMessage="No matching teams"
        />
      </Box>

      <Box>
        <MultiSelect
          label="Department read access"
          description="Grant read access to external departments outside this document owner scope."
          placeholder={canEditAccess ? 'Select departments' : 'Read access is read-only'}
          data={departmentOptions}
          value={departmentReadIds}
          onChange={setDepartmentReadIds}
          searchable
          clearable
          disabled={!canEditAccess || candidatesQuery.isPending}
          nothingFoundMessage="No matching departments"
        />
      </Box>

      <Group justify="flex-end">
        <Button disabled={!canEditAccess || !dirty} loading={saving} onClick={() => void save()}>
          Save access
        </Button>
      </Group>
    </Stack>
  );
}
