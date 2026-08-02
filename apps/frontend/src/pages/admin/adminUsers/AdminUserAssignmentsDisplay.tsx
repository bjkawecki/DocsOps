import { Group, Stack, Text } from '@mantine/core';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import type { UserRow } from './adminUsersTypes';

function formatTeamRole(t: TFunction, team: UserRow['teams'][number]): string {
  if (team.isLead) return t('roles.lead');
  if (team.isAuthor) return t('roles.author');
  return t('roles.member');
}

export function AdminUserAssignmentsDisplay({ user }: { user: UserRow }) {
  const { t } = useTranslation('admin');
  const team = user.teams?.[0];
  const deptLead = user.departmentsAsLead?.[0];
  const deptAuthor = user.departmentsAsAuthor?.[0];

  const departmentName =
    deptLead?.name ??
    deptAuthor?.name ??
    team?.departmentName ??
    user.departments?.[0]?.name ??
    '–';
  const departmentRole = deptLead
    ? t('roles.lead')
    : deptAuthor
      ? t('roles.author')
      : team?.isAuthor
        ? '–'
        : team
          ? t('roles.member')
          : '–';

  const teamName = team?.name ?? '–';
  const teamRole = team ? formatTeamRole(t, team) : '–';

  return (
    <Stack gap="xs">
      <Group justify="flex-start" wrap="nowrap" gap="xl" align="flex-start">
        <div style={{ minWidth: 140 }}>
          <Text size="xs" c="dimmed">
            {t('shared.department')}
          </Text>
          <Text size="sm">{departmentName}</Text>
        </div>
        <div>
          <Text size="xs" c="dimmed">
            {t('users.detail.assignments.role')}
          </Text>
          <Text size="sm">{departmentRole}</Text>
        </div>
      </Group>
      <Group justify="flex-start" wrap="nowrap" gap="xl" align="flex-start">
        <div style={{ minWidth: 140 }}>
          <Text size="xs" c="dimmed">
            {t('users.detail.assignments.team')}
          </Text>
          <Text size="sm">{teamName}</Text>
        </div>
        <div>
          <Text size="xs" c="dimmed">
            {t('users.detail.assignments.role')}
          </Text>
          <Text size="sm">{teamRole}</Text>
        </div>
      </Group>
    </Stack>
  );
}

export function formatUserTeamsColumn(t: TFunction, user: UserRow): string {
  if (!user.teams?.length) return '–';
  return user.teams.map((team) => `${team.name} (${formatTeamRole(t, team)})`).join(', ');
}

export function formatUserDepartmentsColumn(t: TFunction, user: UserRow): string {
  const labels: string[] = [];
  for (const d of user.departmentsAsLead ?? []) {
    labels.push(`${d.name} (${t('roles.lead')})`);
  }
  for (const d of user.departmentsAsAuthor ?? []) {
    if (!user.departmentsAsLead?.some((lead) => lead.id === d.id)) {
      labels.push(`${d.name} (${t('roles.author')})`);
    }
  }
  for (const d of user.departments ?? []) {
    const covered =
      user.departmentsAsLead?.some((lead) => lead.id === d.id) ||
      user.departmentsAsAuthor?.some((author) => author.id === d.id);
    if (!covered) labels.push(d.name);
  }
  return labels.length > 0 ? labels.join(', ') : '–';
}
