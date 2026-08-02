import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../api/client';
import { meQueryKey } from '../../hooks/useMe';
import type { AdminUser } from './appShellNavUtils.js';

type UseAppShellDebugActionsOptions = {
  debugMenuEnabled: boolean;
  showDebugMenu: boolean;
};

/**
 * Dev debug menu: admin user list, impersonation, platform reset/reseed.
 */
export function useAppShellDebugActions({
  debugMenuEnabled,
  showDebugMenu,
}: UseAppShellDebugActionsOptions) {
  const { t } = useTranslation('shell');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: adminUsersRes,
    isLoading: adminUsersLoading,
    isError: adminUsersError,
  } = useQuery<{
    items: AdminUser[];
    total: number;
  }>({
    queryKey: ['admin', 'users', 'list'],
    queryFn: async () => {
      const res = await apiFetch('/api/v1/admin/users?limit=100&includeDeactivated=false');
      if (!res.ok) throw new Error('Failed to load users');
      return (await res.json()) as { items: AdminUser[]; total: number };
    },
    enabled: debugMenuEnabled && showDebugMenu,
  });

  const impersonateMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiFetch('/api/v1/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? 'Impersonation failed');
      }
    },
    onSuccess: () => {
      void queryClient.cancelQueries({ queryKey: meQueryKey }).then(() => {
        void queryClient.invalidateQueries({ queryKey: meQueryKey });
      });
      void navigate('/', { replace: true });
      notifications.show({
        title: t('debug.toastViewSwitchedTitle'),
        message: t('debug.toastViewSwitchedBody'),
        color: 'green',
      });
    },
    onError: (err: Error) => {
      notifications.show({
        title: t('debug.errorTitle'),
        message: err.message,
        color: 'red',
      });
    },
  });

  const stopImpersonateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch('/api/v1/admin/impersonate', { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to end impersonation');
    },
    onSuccess: () => {
      void queryClient.cancelQueries({ queryKey: meQueryKey }).then(() => {
        void queryClient.invalidateQueries({ queryKey: meQueryKey });
      });
      void navigate('/', { replace: true });
      notifications.show({
        title: t('debug.toastImpersonationEndedTitle'),
        message: t('debug.toastImpersonationEndedBody'),
        color: 'green',
      });
    },
    onError: (err: Error) => {
      notifications.show({
        title: t('debug.errorTitle'),
        message: err.message,
        color: 'red',
      });
    },
  });

  const resetPlatformMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch('/api/v1/admin/debug/reset-platform', { method: 'POST' });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? 'Platform reset failed');
      }
      return res.json() as Promise<{ deletedNonAdminUsers: number }>;
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries();
      notifications.show({
        title: t('debug.toastResetDoneTitle'),
        message: t('debug.toastResetDoneBody', { count: data.deletedNonAdminUsers }),
        color: 'green',
      });
    },
    onError: (err: Error) => {
      notifications.show({
        title: t('debug.toastResetFailedTitle'),
        message: err.message,
        color: 'red',
      });
    },
  });

  const reseedPlatformMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch('/api/v1/admin/debug/reseed-platform', { method: 'POST' });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? 'Re-seed failed');
      }
      return res.json() as Promise<{ seeded: true }>;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries();
      notifications.show({
        title: t('debug.toastReseedDoneTitle'),
        message: t('debug.toastReseedDoneBody'),
        color: 'green',
      });
    },
    onError: (err: Error) => {
      notifications.show({
        title: t('debug.toastReseedFailedTitle'),
        message: err.message,
        color: 'red',
      });
    },
  });

  return {
    adminUsersRes,
    adminUsersLoading,
    adminUsersError,
    impersonateMutation,
    stopImpersonateMutation,
    resetPlatformMutation,
    reseedPlatformMutation,
  };
}
