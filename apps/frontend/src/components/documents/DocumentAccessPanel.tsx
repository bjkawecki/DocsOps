import {
  ActionIcon,
  Alert,
  Box,
  Button,
  Group,
  MultiSelect,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { IconQuestionMark } from '@tabler/icons-react';
import { useEffect, useMemo, useState } from 'react';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../api/client';

type GrantsResponse = {
  users: { userId: string; role: 'Read' | 'Write' }[];
  teams: { teamId: string; role: 'Read' | 'Write' }[];
  departments: { departmentId: string; role: 'Read' | 'Write' }[];
};

type ReadCandidatesResponse = {
  teams: { id: string; name: string; departmentName: string }[];
  departments: { id: string; name: string }[];
};

type Props = {
  documentId: string;
  canEditAccess: boolean;
};

function sorted(list: string[]): string[] {
  return [...list].sort((a, b) => a.localeCompare(b));
}

export function DocumentAccessPanel({ documentId, canEditAccess }: Props) {
  const { t } = useTranslation('documents');
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
      (candidatesQuery.data?.teams ?? []).map((row) => ({
        value: row.id,
        label: `${row.name} (${row.departmentName})`,
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
        message: t('access.updateSuccess'),
      });
    } catch (error) {
      notifications.show({
        color: 'red',
        message: error instanceof Error ? error.message : t('access.updateError'),
      });
    } finally {
      setSaving(false);
    }
  };

  if (grantsQuery.isPending) {
    return (
      <Text size="sm" c="dimmed">
        {t('access.loading')}
      </Text>
    );
  }
  if (grantsQuery.isError || !grantsQuery.data) {
    return (
      <Alert color="red" title={t('access.loadErrorTitle')}>
        {t('access.loadError')}
      </Alert>
    );
  }

  const helpLabel = `${t('access.helpRead')}\n\n${t('access.helpWrite')}`;

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
        <Text size="sm" c="dimmed" style={{ lineHeight: 1.4, flex: 1, minWidth: 0 }}>
          {t('access.intro')}
        </Text>
        <Tooltip label={helpLabel} multiline maw={340} withArrow position="bottom-end">
          <ActionIcon
            variant="default"
            color="gray"
            size="sm"
            radius="xl"
            aria-label={t('access.helpAria')}
            style={{ flexShrink: 0 }}
          >
            <IconQuestionMark size={14} stroke={2} />
          </ActionIcon>
        </Tooltip>
      </Group>

      {!canEditAccess && (
        <Alert color="gray" variant="filled" title={t('access.readOnlyTitle')}>
          {t('access.readOnlyBody')}
        </Alert>
      )}

      {candidatesQuery.isError && (
        <Alert color="yellow" title={t('access.candidatesUnavailableTitle')}>
          {t('access.candidatesUnavailableBody')}
        </Alert>
      )}

      <Box>
        <MultiSelect
          label={t('access.teamReadLabel')}
          placeholder={canEditAccess ? t('access.selectTeams') : t('access.readOnlyPlaceholder')}
          data={teamOptions}
          value={teamReadIds}
          onChange={setTeamReadIds}
          searchable
          clearable
          disabled={!canEditAccess || candidatesQuery.isPending}
          nothingFoundMessage={t('access.noMatchingTeams')}
        />
      </Box>

      <Box>
        <MultiSelect
          label={t('access.departmentReadLabel')}
          placeholder={
            canEditAccess ? t('access.selectDepartments') : t('access.readOnlyPlaceholder')
          }
          data={departmentOptions}
          value={departmentReadIds}
          onChange={setDepartmentReadIds}
          searchable
          clearable
          disabled={!canEditAccess || candidatesQuery.isPending}
          nothingFoundMessage={t('access.noMatchingDepartments')}
        />
      </Box>

      <Group justify="flex-end">
        <Button disabled={!canEditAccess || !dirty} loading={saving} onClick={() => void save()}>
          {t('access.saveAccess')}
        </Button>
      </Group>
    </Stack>
  );
}
