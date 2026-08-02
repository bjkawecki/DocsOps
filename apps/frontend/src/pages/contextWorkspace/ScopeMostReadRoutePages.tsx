import { Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { apiFetch } from '../../api/client';
import { useMe } from '../../hooks/useMe';
import { ScopeMostReadPage } from './ScopeMostReadPage.js';

export function CompanyMostReadPage() {
  const { t } = useTranslation(['contexts', 'common']);
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
  const canManage = isAdmin || (me?.identity?.companyLeads?.length ?? 0) > 0;

  const { data: company } = useQuery({
    queryKey: ['companies', effectiveCompanyId],
    queryFn: async () => {
      const res = await apiFetch(`/api/v1/companies/${effectiveCompanyId}`);
      if (!res.ok) throw new Error('Failed to load company');
      return (await res.json()) as { id: string; name: string };
    },
    enabled: effectiveCompanyId != null,
  });

  if (mePending || (isAdmin && !companyIdFromLead && !companyIdFromTeam && firstCompanyPending)) {
    return (
      <Text size="sm" c="dimmed">
        {t('common:status.loading')}
      </Text>
    );
  }

  if (!effectiveCompanyId) {
    return (
      <Text size="sm" c="dimmed">
        {t('routePages.noCompany')}
      </Text>
    );
  }

  return (
    <ScopeMostReadPage
      navScope={{ type: 'company', id: effectiveCompanyId }}
      listScope="company"
      companyId={effectiveCompanyId}
      canManage={canManage}
      scopeLabel={company?.name}
    />
  );
}

export function DepartmentMostReadPage() {
  const { departmentId } = useParams<{ departmentId: string }>();
  const { data: me } = useMe();
  const isAdmin = me?.user?.isAdmin === true;
  const canManage =
    isAdmin ||
    (me?.identity?.departmentLeads?.some((d) => d.id === departmentId) ?? false) ||
    (me?.identity?.companyLeads?.length ?? 0) > 0;
  if (!departmentId) return null;
  return (
    <ScopeMostReadPage
      navScope={{ type: 'department', id: departmentId }}
      listScope="department"
      departmentId={departmentId}
      canManage={canManage}
    />
  );
}

export function TeamMostReadPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const { data: me } = useMe();
  const isAdmin = me?.user?.isAdmin === true;
  const canManage =
    isAdmin ||
    (me?.identity?.teams?.some((t) => t.teamId === teamId && t.role === 'leader') ?? false) ||
    (me?.identity?.departmentLeads?.length ?? 0) > 0 ||
    (me?.identity?.companyLeads?.length ?? 0) > 0;
  if (!teamId) return null;
  return (
    <ScopeMostReadPage
      navScope={{ type: 'team', id: teamId }}
      listScope="team"
      teamId={teamId}
      canManage={canManage}
    />
  );
}

export function PersonalMostReadPage() {
  const { t } = useTranslation('contexts');
  return (
    <ScopeMostReadPage
      navScope={{ type: 'personal' }}
      listScope="personal"
      scopeLabel={t('scopeKind.personal')}
      canManage
    />
  );
}
