import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../api/client';
import type { CanViewScopePeopleParams, CanViewScopePeopleResponse } from '../api/me-types';

const STALE_MS = 30_000;

function buildCanViewScopePeopleUrl(params: CanViewScopePeopleParams): string {
  const search = new URLSearchParams({ scope: params.scope });
  if (params.scope === 'company') search.set('companyId', params.companyId);
  if (params.scope === 'department') search.set('departmentId', params.departmentId);
  if (params.scope === 'team') search.set('teamId', params.teamId);
  return `/api/v1/me/can-view-scope-people?${search}`;
}

export function canViewScopePeopleQueryKey(params: CanViewScopePeopleParams | null) {
  if (params == null) return ['me', 'can-view-scope-people', 'disabled'] as const;
  if (params.scope === 'company') {
    return ['me', 'can-view-scope-people', 'company', params.companyId] as const;
  }
  if (params.scope === 'department') {
    return ['me', 'can-view-scope-people', 'department', params.departmentId] as const;
  }
  return ['me', 'can-view-scope-people', 'team', params.teamId] as const;
}

async function fetchCanViewScopePeople(
  params: CanViewScopePeopleParams
): Promise<CanViewScopePeopleResponse> {
  const res = await apiFetch(buildCanViewScopePeopleUrl(params));
  if (!res.ok) throw new Error('Failed to load scope people permission');
  return (await res.json()) as CanViewScopePeopleResponse;
}

export function useCanViewScopePeople(params: CanViewScopePeopleParams | null) {
  const enabled =
    params != null &&
    ((params.scope === 'company' && params.companyId.length > 0) ||
      (params.scope === 'department' && params.departmentId.length > 0) ||
      (params.scope === 'team' && params.teamId.length > 0));

  return useQuery({
    queryKey: canViewScopePeopleQueryKey(params),
    queryFn: () => fetchCanViewScopePeople(params!),
    enabled,
    staleTime: STALE_MS,
  });
}
