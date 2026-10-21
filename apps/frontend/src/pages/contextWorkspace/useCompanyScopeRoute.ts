import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../api/client';
import { useMe } from '../../hooks/useMe';

export type CompanyScopeRouteState = {
  mePending: boolean;
  firstCompanyPending: boolean;
  effectiveCompanyId: string | undefined;
  canManage: boolean;
  companyName: string | undefined;
  waitingForCompany: boolean;
};

/**
 * Resolves the company id for company-scoped route pages (most-read, trash, archive).
 * Prefers company lead, then membership, then first company for platform admins.
 */
export function useCompanyScopeRoute(): CompanyScopeRouteState {
  const { data: me, isPending: mePending } = useMe();
  const isAdmin = me?.user?.isAdmin === true;
  const companyIdFromLead = me?.identity?.companyLeads?.[0]?.id;
  const companyIdFromTeam =
    me?.identity?.teams?.[0]?.companyId ??
    me?.identity?.departmentLeads?.[0]?.companyId ??
    me?.identity?.departmentAuthors?.[0]?.companyId;

  const { data: firstCompany, isPending: firstCompanyPending } = useQuery({
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
  const canManage = (me?.identity?.companyLeads?.length ?? 0) > 0;

  const { data: company } = useQuery({
    queryKey: ['companies', effectiveCompanyId],
    queryFn: async () => {
      const res = await apiFetch(`/api/v1/companies/${effectiveCompanyId}`);
      if (!res.ok) throw new Error('Failed to load company');
      return (await res.json()) as { id: string; name: string };
    },
    enabled: effectiveCompanyId != null,
  });

  const waitingForCompany =
    mePending || (isAdmin && !companyIdFromLead && !companyIdFromTeam && firstCompanyPending);

  return {
    mePending,
    firstCompanyPending,
    effectiveCompanyId,
    canManage,
    companyName: company?.name,
    waitingForCompany,
  };
}

export function canManageDepartmentScope(
  me: ReturnType<typeof useMe>['data'],
  departmentId: string
): boolean {
  return (
    (me?.identity?.departmentLeads?.some((d) => d.id === departmentId) ?? false) ||
    (me?.identity?.companyLeads?.length ?? 0) > 0
  );
}

export function canManageTeamScope(me: ReturnType<typeof useMe>['data'], teamId: string): boolean {
  return (
    (me?.identity?.teams?.some((t) => t.teamId === teamId && t.role === 'leader') ?? false) ||
    (me?.identity?.departmentLeads?.length ?? 0) > 0 ||
    (me?.identity?.companyLeads?.length ?? 0) > 0
  );
}
