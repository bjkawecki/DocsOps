import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AdminSystemCheckUpdatesResponse, AdminSystemUpdateStatus } from 'backend/api-types';
import { apiFetch } from '../api/client.js';

export const adminUpdateStatusQueryKey = ['admin', 'system', 'update-status'] as const;

async function fetchAdminUpdateStatus(): Promise<AdminSystemUpdateStatus> {
  const res = await apiFetch('/api/v1/admin/system/update-status');
  if (!res.ok) {
    throw new Error('Could not load update status');
  }
  return res.json() as Promise<AdminSystemUpdateStatus>;
}

async function postCheckForUpdates(): Promise<AdminSystemCheckUpdatesResponse> {
  const res = await apiFetch('/api/v1/admin/system/check-updates', { method: 'POST' });
  if (!res.ok) {
    throw new Error('Update check failed');
  }
  return res.json() as Promise<AdminSystemCheckUpdatesResponse>;
}

export function useAdminUpdateStatus(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: adminUpdateStatusQueryKey,
    queryFn: fetchAdminUpdateStatus,
    enabled: options?.enabled !== false,
    staleTime: 60_000,
  });
}

export function useCheckForUpdates() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postCheckForUpdates,
    onSuccess: (data) => {
      queryClient.setQueryData(adminUpdateStatusQueryKey, data.status);
    },
  });
}
