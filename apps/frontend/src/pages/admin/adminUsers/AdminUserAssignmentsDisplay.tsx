import { Group, Stack, Text } from '@mantine/core';
import type { UserRow } from './adminUsersTypes';

function formatTeamRole(team: UserRow['teams'][number]): string {
  if (team.isLead) return 'Lead';
  if (team.isAuthor) return 'Author';
  return 'Member';
}

export function AdminUserAssignmentsDisplay({ user }: { user: UserRow }) {
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
    ? 'Lead'
    : deptAuthor
      ? 'Author'
      : team?.isAuthor
        ? '–'
        : team
          ? 'Member'
          : '–';

  const teamName = team?.name ?? '–';
  const teamRole = team ? formatTeamRole(team) : '–';

  return (
    <Stack gap="xs">
      <Group justify="flex-start" wrap="nowrap" gap="xl" align="flex-start">
        <div style={{ minWidth: 140 }}>
          <Text size="xs" c="dimmed">
            Department
          </Text>
          <Text size="sm">{departmentName}</Text>
        </div>
        <div>
          <Text size="xs" c="dimmed">
            Role
          </Text>
          <Text size="sm">{departmentRole}</Text>
        </div>
      </Group>
      <Group justify="flex-start" wrap="nowrap" gap="xl" align="flex-start">
        <div style={{ minWidth: 140 }}>
          <Text size="xs" c="dimmed">
            Team
          </Text>
          <Text size="sm">{teamName}</Text>
        </div>
        <div>
          <Text size="xs" c="dimmed">
            Role
          </Text>
          <Text size="sm">{teamRole}</Text>
        </div>
      </Group>
    </Stack>
  );
}

export function formatUserTeamsColumn(user: UserRow): string {
  if (!user.teams?.length) return '–';
  return user.teams.map((t) => `${t.name} (${formatTeamRole(t)})`).join(', ');
}

export function formatUserDepartmentsColumn(user: UserRow): string {
  const labels: string[] = [];
  for (const d of user.departmentsAsLead ?? []) {
    labels.push(`${d.name} (Lead)`);
  }
  for (const d of user.departmentsAsAuthor ?? []) {
    if (!user.departmentsAsLead?.some((lead) => lead.id === d.id)) {
      labels.push(`${d.name} (Author)`);
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
