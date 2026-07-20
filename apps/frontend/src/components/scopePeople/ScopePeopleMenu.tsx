import {
  Avatar,
  Badge,
  Box,
  Button,
  Divider,
  Group,
  Indicator,
  Popover,
  ScrollArea,
  Stack,
  Text,
} from '@mantine/core';
import { IconUsers } from '@tabler/icons-react';
import { useEffect, useMemo, useState } from 'react';
import type { ScopePersonRow } from '../../api/scopePeople-types';
import { useCompanyPeople, useDepartmentPeople, useTeamPeople } from '../../hooks/useScopePeople';
import {
  useDepartmentAuthorMutations,
  useTeamAuthorMutations,
} from '../../hooks/useScopeAuthorMutations';
import { formatPresence, initialsFromName } from '../../lib/formatPresence';

export type ScopePeopleScope = 'team' | 'department' | 'company';

type ScopePeopleMenuProps = {
  scope: ScopePeopleScope;
  scopeId: string;
  enabled?: boolean;
  canManageAuthors?: boolean;
};

type PersonAction = {
  label: string;
  onClick: () => void;
};

type PersonLineProps = {
  person: ScopePersonRow;
  actions?: PersonAction[];
  actionsDisabled?: boolean;
};

function PersonLine({ person, actions, actionsDisabled }: PersonLineProps) {
  const presence = formatPresence(person.isOnline, person.lastActiveAt);
  const roleLabel =
    person.roles?.includes('lead') && person.roles.includes('member')
      ? 'Lead, Member'
      : person.roles?.includes('lead')
        ? 'Lead'
        : person.roles?.includes('author')
          ? 'Author'
          : person.roles?.includes('member')
            ? 'Member'
            : null;
  const detail = [roleLabel, presence].filter(Boolean).join(' · ');

  return (
    <Group gap="sm" wrap="nowrap" align="center" justify="space-between">
      <Group gap="sm" wrap="nowrap" align="flex-start" style={{ minWidth: 0, flex: 1 }}>
        <Indicator color="green" size={10} offset={4} disabled={!person.isOnline} processing>
          <Avatar size="sm" radius="xl" color="var(--mantine-primary-color-filled)">
            {initialsFromName(person.name)}
          </Avatar>
        </Indicator>
        <Box style={{ minWidth: 0, flex: 1 }}>
          <Text size="sm" fw={500} lineClamp={1}>
            {person.name}
          </Text>
          {detail ? (
            <Text size="xs" c="dimmed">
              {detail}
            </Text>
          ) : null}
        </Box>
      </Group>
      {actions && actions.length > 0 ? (
        <Group gap={4} wrap="nowrap">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant="light"
              size="compact-xs"
              disabled={actionsDisabled}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ))}
        </Group>
      ) : null}
    </Group>
  );
}

export function ScopePeopleMenu({
  scope,
  scopeId,
  enabled = true,
  canManageAuthors = false,
}: ScopePeopleMenuProps) {
  const [opened, setOpened] = useState(false);

  const teamQuery = useTeamPeople(scopeId, enabled && scope === 'team');
  const deptQuery = useDepartmentPeople(scopeId, enabled && scope === 'department');
  const companyQuery = useCompanyPeople(scopeId, enabled && scope === 'company');

  const teamAuthorMutations = useTeamAuthorMutations(scope === 'team' ? scopeId : '');
  const deptAuthorMutations = useDepartmentAuthorMutations(scope === 'department' ? scopeId : '');

  const activeQuery =
    scope === 'team' ? teamQuery : scope === 'department' ? deptQuery : companyQuery;

  const mutationsPending =
    scope === 'team'
      ? teamAuthorMutations.isPending
      : scope === 'department'
        ? deptAuthorMutations.isPending
        : false;

  useEffect(() => {
    if (opened) void activeQuery.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch only when menu opens
  }, [opened, scope, scopeId]);

  const buttonLabel = scope === 'company' ? 'Organization' : 'People';

  const summaryText = useMemo(() => {
    if (scope === 'team' && teamQuery.data) {
      return `${teamQuery.data.total} · ${teamQuery.data.onlineCount} online`;
    }
    if (scope === 'department' && deptQuery.data) {
      const { peopleCount, onlineCount } = deptQuery.data.summary;
      return `${peopleCount} · ${onlineCount} online`;
    }
    if (scope === 'company' && companyQuery.data) {
      const { departmentCount, peopleCount, onlineCount } = companyQuery.data.summary;
      return `${departmentCount} depts · ${peopleCount} people · ${onlineCount} active`;
    }
    return null;
  }, [scope, teamQuery.data, deptQuery.data, companyQuery.data]);

  function teamPersonActions(person: ScopePersonRow): PersonAction[] | undefined {
    if (!canManageAuthors) return undefined;
    const isAuthor = person.roles?.includes('author');
    const isMember = person.roles?.includes('member');
    const isLead = person.roles?.includes('lead');
    if (isLead) return undefined;
    if (isAuthor) {
      return [
        {
          label: 'Set as member',
          onClick: () => void teamAuthorMutations.removeAuthor.mutateAsync(person.id),
        },
      ];
    }
    if (isMember) {
      return [
        {
          label: 'Set as author',
          onClick: () => void teamAuthorMutations.assignAuthor.mutateAsync(person.id),
        },
      ];
    }
    return undefined;
  }

  function deptMemberActions(person: ScopePersonRow): PersonAction[] | undefined {
    if (!canManageAuthors) return undefined;
    return [
      {
        label: 'Set as author',
        onClick: () => void deptAuthorMutations.assignAuthor.mutateAsync(person.id),
      },
    ];
  }

  function deptAuthorActions(person: ScopePersonRow): PersonAction[] | undefined {
    if (!canManageAuthors || !deptQuery.data) return undefined;
    const teams = deptQuery.data.teams;
    if (teams.length === 0) return undefined;
    return teams.map((team) => ({
      label: teams.length === 1 ? 'Set as member' : `Member · ${team.name}`,
      onClick: () =>
        void deptAuthorMutations.removeAuthor.mutateAsync({
          userId: person.id,
          teamId: team.id,
        }),
    }));
  }

  const listError =
    activeQuery.isError && !activeQuery.data
      ? 'Failed to load people.'
      : activeQuery.isError && activeQuery.data
        ? 'Could not refresh the list.'
        : null;

  const dropdown = (
    <ScrollArea.Autosize mah={420} type="auto">
      <Stack gap="sm" p="xs" miw={320}>
        {activeQuery.isPending && !activeQuery.data && (
          <Text size="sm" c="dimmed">
            Loading…
          </Text>
        )}
        {listError ? (
          <Text size="sm" c={activeQuery.data ? 'dimmed' : 'red'}>
            {listError}
          </Text>
        ) : null}
        {scope === 'team' && teamQuery.data && (
          <>
            {teamQuery.data.items.length === 0 ? (
              <Text size="sm" c="dimmed">
                No members yet.
              </Text>
            ) : (
              teamQuery.data.items.map((person) => (
                <PersonLine
                  key={person.id}
                  person={person}
                  actions={teamPersonActions(person)}
                  actionsDisabled={mutationsPending}
                />
              ))
            )}
          </>
        )}
        {scope === 'department' && deptQuery.data && (
          <>
            {deptQuery.data.departmentLeads.length > 0 && (
              <>
                <Text size="xs" tt="uppercase" c="dimmed" fw={600}>
                  Department leads
                </Text>
                {deptQuery.data.departmentLeads.map((person) => (
                  <PersonLine key={person.id} person={person} />
                ))}
                <Divider />
              </>
            )}
            {(deptQuery.data.departmentAuthors ?? []).length > 0 && (
              <>
                <Text size="xs" tt="uppercase" c="dimmed" fw={600}>
                  Authors
                </Text>
                {(deptQuery.data.departmentAuthors ?? []).map((person) => (
                  <PersonLine
                    key={`author-${person.id}`}
                    person={person}
                    actions={deptAuthorActions(person)}
                    actionsDisabled={mutationsPending}
                  />
                ))}
                <Divider />
              </>
            )}
            {deptQuery.data.teams.map((team) => (
              <Box key={team.id}>
                <Text size="sm" fw={600} mb={4}>
                  {team.name}
                </Text>
                <Stack gap="xs" pl="xs">
                  {team.teamLeads.map((person) => (
                    <PersonLine key={`lead-${person.id}`} person={person} />
                  ))}
                  {team.members.map((person) => (
                    <PersonLine
                      key={`member-${person.id}`}
                      person={person}
                      actions={deptMemberActions(person)}
                      actionsDisabled={mutationsPending}
                    />
                  ))}
                  {team.teamLeads.length === 0 && team.members.length === 0 && (
                    <Text size="xs" c="dimmed">
                      No members.
                    </Text>
                  )}
                </Stack>
              </Box>
            ))}
          </>
        )}
        {scope === 'company' && companyQuery.data && (
          <>
            {companyQuery.data.companyLeads.length > 0 && (
              <>
                <Text size="xs" tt="uppercase" c="dimmed" fw={600}>
                  Company leads
                </Text>
                {companyQuery.data.companyLeads.map((person) => (
                  <PersonLine key={person.id} person={person} />
                ))}
                <Divider />
              </>
            )}
            {companyQuery.data.departments.map((dept) => (
              <Box key={dept.id}>
                <Text size="sm" fw={600}>
                  {dept.name}
                </Text>
                <Text size="xs" c="dimmed" mb={4}>
                  {dept.teamCount} teams · {dept.peopleCount} people · {dept.onlineCount} active
                </Text>
                {dept.departmentLeads.length > 0 && (
                  <Stack gap="xs" pl="xs" mb="xs">
                    {dept.departmentLeads.map((person) => (
                      <PersonLine key={person.id} person={person} />
                    ))}
                  </Stack>
                )}
                <Stack gap={4} pl="xs">
                  {dept.teams.map((team) => (
                    <Text key={team.id} size="xs" c="dimmed">
                      {team.name} · {team.peopleCount} people · {team.onlineCount} active
                    </Text>
                  ))}
                </Stack>
              </Box>
            ))}
          </>
        )}
      </Stack>
    </ScrollArea.Autosize>
  );

  return (
    <Popover opened={opened} onChange={setOpened} position="bottom-start" withArrow shadow="md">
      <Popover.Target>
        <Button
          variant="default"
          size="sm"
          leftSection={<IconUsers size={16} />}
          rightSection={
            summaryText != null ? (
              <Badge variant="light" size="sm">
                {summaryText}
              </Badge>
            ) : undefined
          }
          onClick={() => setOpened(!opened)}
        >
          {buttonLabel}
        </Button>
      </Popover.Target>
      <Popover.Dropdown p={0}>{dropdown}</Popover.Dropdown>
    </Popover>
  );
}
