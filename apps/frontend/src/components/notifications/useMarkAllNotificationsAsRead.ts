import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../api/client';

/** Marks all inbox notifications as read and refreshes notification queries. */
export function useMarkAllNotificationsAsRead() {
  const { t } = useTranslation('notifications');
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await apiFetch('/api/v1/me/notifications/read-all', { method: 'PATCH' });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? t('toasts.markAllFailed'));
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['me', 'notifications'] });
      notifications.show({
        title: t('toasts.markAllSuccessTitle'),
        message: t('toasts.markAllSuccessMessage'),
        color: 'green',
      });
    },
    onError: (error: Error) => {
      notifications.show({
        title: t('toasts.updateFailedTitle'),
        message: error.message,
        color: 'red',
      });
    },
  });
}
