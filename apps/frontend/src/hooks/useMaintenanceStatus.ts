import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../api/client';

export type MaintenanceStatus = {
  active: boolean;
  reason?: 'backup' | 'restore' | 'platform-import' | 'update';
};

export function maintenanceStatusQueryKey(): readonly ['maintenance', 'status'] {
  return ['maintenance', 'status'] as const;
}

/** Fetch-on-mount; live updates via SSE (plan §23a). */
export function useMaintenanceStatus() {
  return useQuery({
    queryKey: maintenanceStatusQueryKey(),
    queryFn: async (): Promise<MaintenanceStatus> => {
      const res = await apiFetch('/api/v1/maintenance/status');
      if (!res.ok) throw new Error('Failed to load maintenance status');
      return res.json() as Promise<MaintenanceStatus>;
    },
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
