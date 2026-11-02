import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../api/client';
import type { UserPreferences } from '../../components/system/ThemeFromPreferences';
import { meQueryKey } from '../../hooks/useMe';

type ToastKeys = {
  updatedTitle: string;
  updatedMessage: string;
  saveFailedTitle: string;
};

type Options = {
  toastKeys: ToastKeys;
  /** Extra query keys to invalidate after a successful patch (e.g. pulse). */
  extraInvalidateKeys?: unknown[][];
};

/**
 * Shared PATCH /me/preferences mutation with success/error toasts.
 */
export function usePatchMePreferences({ toastKeys, extraInvalidateKeys = [] }: Options) {
  const { t } = useTranslation('settings');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: Partial<UserPreferences>) => {
      const res = await apiFetch('/api/v1/me/preferences', {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? 'Failed to save preferences');
      }
      return (await res.json()) as UserPreferences;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: meQueryKey });
      for (const queryKey of extraInvalidateKeys) {
        void queryClient.invalidateQueries({ queryKey });
      }
      notifications.show({
        title: t(toastKeys.updatedTitle),
        message: t(toastKeys.updatedMessage),
        color: 'green',
      });
    },
    onError: (error: Error) => {
      notifications.show({
        title: t(toastKeys.saveFailedTitle),
        message: error.message,
        color: 'red',
      });
    },
  });
}
