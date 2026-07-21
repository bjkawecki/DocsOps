import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { apiFetch } from '../../api/client';

/** Marks all inbox notifications as read and refreshes notification queries. */
export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await apiFetch('/api/v1/me/notifications/read-all', { method: 'PATCH' });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? 'Failed to mark all notifications as read');
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['me', 'notifications'] });
      notifications.show({
        title: 'Notifications updated',
        message: 'All notifications were marked as read.',
        color: 'green',
      });
    },
    onError: (error: Error) => {
      notifications.show({ title: 'Update failed', message: error.message, color: 'red' });
    },
  });
}
