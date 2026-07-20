import { Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { apiFetch } from '../../api/client';
import { useMe } from '../../hooks/useMe';
import { ScopeWorkspaceEntry } from '../contextWorkspace/ScopeWorkspaceEntry.js';

type DepartmentRes = { id: string; name: string; companyId?: string; company?: { id: string } };

export function DepartmentContextPage() {
  const { departmentId } = useParams<{ departmentId: string }>();
  const { data: me, isPending: mePending } = useMe();

  const {
    data: department,
    isPending: departmentPending,
    isError: departmentError,
  } = useQuery({
    queryKey: ['department', departmentId],
    queryFn: async (): Promise<DepartmentRes> => {
      if (!departmentId) throw new Error('Missing departmentId');
      const res = await apiFetch(`/api/v1/departments/${departmentId}`);
      if (!res.ok) throw new Error('Failed to load department');
      return (await res.json()) as DepartmentRes;
    },
    enabled: !!departmentId,
  });

  const companyId = department?.companyId ?? department?.company?.id;
  const isAdmin = me?.user?.isAdmin === true;
  const isDepartmentLead =
    (me?.identity?.departmentLeads?.length ?? 0) > 0 &&
    me?.identity?.departmentLeads?.some((d) => d.id === departmentId);
  const isCompanyLead =
    companyId != null &&
    (me?.identity?.companyLeads?.length ?? 0) > 0 &&
    me?.identity?.companyLeads?.some((c) => c.id === companyId);
  const canManage = !!(isAdmin || isDepartmentLead || isCompanyLead);

  if (mePending || departmentPending) {
    return (
      <Text size="sm" c="dimmed">
        Loading…
      </Text>
    );
  }
  if (!departmentId || departmentError || !department) {
    return (
      <Text size="sm" c="red">
        Department not found.
      </Text>
    );
  }

  return (
    <ScopeWorkspaceEntry
      scope={{ type: 'department', id: departmentId }}
      scopeLabel={department.name}
      canManage={canManage}
    />
  );
}
