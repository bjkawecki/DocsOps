import { Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../api/client';
import { useMe } from '../../hooks/useMe';
import { ScopeWorkspaceEntry } from '../contextWorkspace/ScopeWorkspaceEntry.js';

type CompanyRes = { id: string; name: string };

/**
 * Company scope landing → default context workspace or empty create state.
 */
export function CompanyPage() {
  const { data: me, isPending: mePending } = useMe();
  const isAdmin = me?.user?.isAdmin === true;
  const companyIdFromLead = me?.identity?.companyLeads?.[0]?.id;
  const companyIdFromTeam =
    me?.identity?.teams?.[0]?.companyId ??
    me?.identity?.departmentLeads?.[0]?.companyId ??
    me?.identity?.departmentAuthors?.[0]?.companyId;

  const { data: firstCompany } = useQuery({
    queryKey: ['companies', 'first'],
    queryFn: async () => {
      const res = await apiFetch('/api/v1/companies?limit=1');
      if (!res.ok) throw new Error('Failed to load companies');
      const data = (await res.json()) as { items: { id: string }[] };
      return data.items[0] ?? null;
    },
    enabled: isAdmin && !companyIdFromLead && !companyIdFromTeam,
  });

  const effectiveCompanyId = companyIdFromLead ?? companyIdFromTeam ?? firstCompany?.id;

  const { data: company } = useQuery({
    queryKey: ['companies', effectiveCompanyId],
    queryFn: async () => {
      const res = await apiFetch(`/api/v1/companies/${effectiveCompanyId}`);
      if (!res.ok) throw new Error('Failed to load company');
      return (await res.json()) as CompanyRes;
    },
    enabled: effectiveCompanyId != null,
  });

  const canManage = (me?.identity?.companyLeads?.length ?? 0) > 0 || isAdmin;

  if (mePending) {
    return (
      <Text size="sm" c="dimmed">
        Loading…
      </Text>
    );
  }

  if (!effectiveCompanyId) {
    return (
      <Text size="sm" c="dimmed">
        No company available.
      </Text>
    );
  }

  return (
    <ScopeWorkspaceEntry
      scope={{ type: 'company', id: effectiveCompanyId }}
      scopeLabel={company?.name}
      canManage={canManage}
    />
  );
}
