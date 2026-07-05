import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../api/client';
import type { NewContextScope } from './NewContextModal';

const SCOPE_KIND_LABELS: Record<NewContextScope['type'], string> = {
  personal: 'Personal',
  company: 'Company',
  department: 'Department',
  team: 'Team',
};

function formatScopeLabel(kind: string, name: string): string {
  return `${kind} · ${name}`;
}

type ScopeDisplayLabel = {
  label: string;
  isPending: boolean;
};

export function useNewContextScopeDisplayLabel(
  scope: NewContextScope,
  enabled: boolean
): ScopeDisplayLabel {
  const kind = SCOPE_KIND_LABELS[scope.type];

  const companyQuery = useQuery({
    queryKey: ['company', scope.type === 'company' ? scope.companyId : ''],
    queryFn: async (): Promise<{ name: string }> => {
      if (scope.type !== 'company') throw new Error('Unexpected scope');
      const res = await apiFetch(`/api/v1/companies/${scope.companyId}`);
      if (!res.ok) throw new Error('Failed to load company');
      return (await res.json()) as { name: string };
    },
    enabled: enabled && scope.type === 'company',
  });

  const departmentQuery = useQuery({
    queryKey: ['department', scope.type === 'department' ? scope.departmentId : ''],
    queryFn: async (): Promise<{ name: string }> => {
      if (scope.type !== 'department') throw new Error('Unexpected scope');
      const res = await apiFetch(`/api/v1/departments/${scope.departmentId}`);
      if (!res.ok) throw new Error('Failed to load department');
      return (await res.json()) as { name: string };
    },
    enabled: enabled && scope.type === 'department',
  });

  const teamQuery = useQuery({
    queryKey: ['team', scope.type === 'team' ? scope.teamId : ''],
    queryFn: async (): Promise<{ name: string }> => {
      if (scope.type !== 'team') throw new Error('Unexpected scope');
      const res = await apiFetch(`/api/v1/teams/${scope.teamId}`);
      if (!res.ok) throw new Error('Failed to load team');
      return (await res.json()) as { name: string };
    },
    enabled: enabled && scope.type === 'team',
  });

  switch (scope.type) {
    case 'personal':
      return { label: kind, isPending: false };
    case 'company': {
      if (companyQuery.isPending) return { label: '', isPending: true };
      if (companyQuery.data?.name != null) {
        return { label: formatScopeLabel(kind, companyQuery.data.name), isPending: false };
      }
      return { label: kind, isPending: false };
    }
    case 'department': {
      if (departmentQuery.isPending) return { label: '', isPending: true };
      if (departmentQuery.data?.name != null) {
        return { label: formatScopeLabel(kind, departmentQuery.data.name), isPending: false };
      }
      return { label: kind, isPending: false };
    }
    case 'team': {
      if (teamQuery.isPending) return { label: '', isPending: true };
      if (teamQuery.data?.name != null) {
        return { label: formatScopeLabel(kind, teamQuery.data.name), isPending: false };
      }
      return { label: kind, isPending: false };
    }
  }
}
