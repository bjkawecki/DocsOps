import { useQuery } from '@tanstack/react-query';
import type { OrgRoleLabels } from 'backend/api-types';
import { apiFetch } from '../api/client';

export type PublicConfig = {
  demoMode: boolean;
  orgRoleLabels: OrgRoleLabels;
};

export function publicConfigQueryKey(): readonly ['system', 'public-config'] {
  return ['system', 'public-config'] as const;
}

/** Unauthenticated runtime flags (e.g. DEMO_MODE, org role labels for login UI). */
export function usePublicConfig() {
  return useQuery({
    queryKey: publicConfigQueryKey(),
    queryFn: async (): Promise<PublicConfig> => {
      const res = await apiFetch('/api/v1/system/public-config');
      if (!res.ok) throw new Error('Failed to load public config');
      const body = (await res.json()) as {
        demoMode?: boolean;
        orgRoleLabels?: OrgRoleLabels;
      };
      return {
        demoMode: Boolean(body.demoMode),
        orgRoleLabels: body.orgRoleLabels ?? {},
      };
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
