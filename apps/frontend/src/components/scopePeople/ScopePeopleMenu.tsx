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
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('common');
  const presence = formatPresence(person.isOnline, person.lastActiveAt);
  const roleLabel =
    person.roles?.includes('lead') && person.roles.includes('member')
      ? t('common:scopePeople.roleLeadMember')
      : person.roles?.includes('lead')
        ? t('common:scopePeople.roleLead')
        : person.roles?.includes('author')
          ? t('common:scopePeople.roleAuthor')
          : person.roles?.includes('member')
            ? t('common:scopePeople.roleMember')
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
  const { t } = useTranslation(['common', 'shell']);
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

  const buttonLabel = scope === 'company' ? t('shell:nav.organization') : t('shell:people');

  const summaryText = useMemo(() => {
    if (scope === 'team' && teamQuery.data) {
      return t('common:scopePeople.peopleOnlineSummary', {
        count: teamQuery.data.total,
        online: teamQuery.data.onlineCount,
      });
    }
    if (scope === 'department' && deptQuery.data) {
      const { peopleCount, onlineCount } = deptQuery.data.summary;
      return t('common:scopePeople.peopleOnlineSummary', {
        count: peopleCount,
        online: onlineCount,
      });
    }
    if (scope === 'company' && companyQuery.data) {
      const { departmentCount, peopleCount, onlineCount } = companyQuery.data.summary;
      return t('common:scopePeople.companySummary', {
        departments: departmentCount,
        people: peopleCount,
        online: onlineCount,
      });
    }
    return null;
  }, [scope, teamQuery.data, deptQuery.data, companyQuery.data, t]);

  function teamPersonActions(person: ScopePersonRow): PersonAction[] | undefined {
    if (!canManageAuthors) return undefined;
    const isAuthor = person.roles?.includes('author');
    const isMember = person.roles?.includes('member');
    const isLead = person.roles?.includes('lead');
    if (isLead) return undefined;
    if (isAuthor) {
      return [
        {
          label: t('common:scopePeople.setAsMember'),
          onClick: () => void teamAuthorMutations.removeAuthor.mutateAsync(person.id),
        },
      ];
    }
    if (isMember) {
      return [
        {
          label: t('common:scopePeople.setAsAuthor'),
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
        label: t('common:scopePeople.setAsAuthor'),
        onClick: () => void deptAuthorMutations.assignAuthor.mutateAsync(person.id),
      },
    ];
  }

  function deptAuthorActions(person: ScopePersonRow): PersonAction[] | undefined {
    if (!canManageAuthors || !deptQuery.data) return undefined;
    const teams = deptQuery.data.teams;
    if (teams.length === 0) return undefined;
    return teams.map((team) => ({
      label:
        teams.length === 1
          ? t('common:scopePeople.setAsMember')
          : t('common:scopePeople.setAsMemberInTeam', { team: team.name }),
      onClick: () =>
        void deptAuthorMutations.removeAuthor.mutateAsync({
          userId: person.id,
          teamId: team.id,
        }),
    }));
  }

  const listError =
    activeQuery.isError && !activeQuery.data
      ? t('common:scopePeople.loadFailed')
      : activeQuery.isError && activeQuery.data
        ? t('common:scopePeople.refreshFailed')
        : null;

  const dropdown = (
    <ScrollArea.Autosize mah={420} type="auto">
      <Stack gap="sm" p="xs" miw={320}>
        {activeQuery.isPending && !activeQuery.data && (
          <Text size="sm" c="dimmed">
            {t('common:status.loading')}
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
                {t('common:scopePeople.noMembersYet')}
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
                  {t('common:scopePeople.departmentLeads')}
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
                  {t('common:scopePeople.authors')}
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
                      {t('common:scopePeople.noMembers')}
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
                  {t('common:scopePeople.companyLeads')}
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
                  {t('common:scopePeople.departmentDetailSummary', {
                    teams: dept.teamCount,
                    people: dept.peopleCount,
                    online: dept.onlineCount,
                  })}
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
                      {team.name} ·{' '}
                      {t('common:scopePeople.teamDetailSummary', {
                        people: team.peopleCount,
                        online: team.onlineCount,
                      })}
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
