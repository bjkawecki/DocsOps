import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../api/client';

export type PublicConfig = {
  demoMode: boolean;
};

export function publicConfigQueryKey(): readonly ['system', 'public-config'] {
  return ['system', 'public-config'] as const;
}

/** Unauthenticated runtime flags (e.g. DEMO_MODE for login UI). */
export function usePublicConfig() {
  return useQuery({
    queryKey: publicConfigQueryKey(),
    queryFn: async (): Promise<PublicConfig> => {
      const res = await apiFetch('/api/v1/system/public-config');
      if (!res.ok) throw new Error('Failed to load public config');
      return res.json() as Promise<PublicConfig>;
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
