import { Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { apiFetch } from '../../api/client';
import { useMe } from '../../hooks/useMe';
import { ScopeWorkspaceEntry } from '../contextWorkspace/ScopeWorkspaceEntry.js';
import type { TeamRes } from './teamContextPageTypes';

export function TeamContextPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const { data: me, isPending: mePending } = useMe();

  const {
    data: team,
    isPending: teamPending,
    isError: teamError,
  } = useQuery({
    queryKey: ['team', teamId],
    queryFn: async (): Promise<TeamRes> => {
      if (!teamId) throw new Error('Missing teamId');
      const res = await apiFetch(`/api/v1/teams/${teamId}`);
      if (!res.ok) throw new Error('Failed to load team');
      return (await res.json()) as TeamRes;
    },
    enabled: !!teamId,
  });

  const departmentId = team?.departmentId ?? team?.department?.id;
  const companyId = team?.department?.companyId ?? team?.department?.company?.id;
  const isAdmin = me?.user?.isAdmin === true;
  const isTeamLead =
    (me?.identity?.teams?.length ?? 0) > 0 &&
    me?.identity?.teams?.some((t) => t.teamId === teamId && t.role === 'leader');
  const isDepartmentLead =
    departmentId != null &&
    (me?.identity?.departmentLeads?.length ?? 0) > 0 &&
    me?.identity?.departmentLeads?.some((d) => d.id === departmentId);
  const isCompanyLead =
    companyId != null &&
    (me?.identity?.companyLeads?.length ?? 0) > 0 &&
    me?.identity?.companyLeads?.some((c) => c.id === companyId);
  const canManage = !!(isAdmin || isTeamLead || isDepartmentLead || isCompanyLead);

  if (mePending || teamPending) {
    return (
      <Text size="sm" c="dimmed">
        Loading…
      </Text>
    );
  }
  if (!teamId || teamError || !team) {
    return (
      <Text size="sm" c="red">
        Team not found.
      </Text>
    );
  }

  return (
    <ScopeWorkspaceEntry
      scope={{ type: 'team', id: teamId }}
      scopeLabel={team.name}
      canManage={canManage}
    />
  );
}
