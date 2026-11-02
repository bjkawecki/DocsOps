import { useMutation } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { apiFetch } from '../../../api/client';
import { buildDestinationBody, type DestinationFormState } from './adminBackupDestinationForm';
import type { TranslateFn } from './adminBackupTypes';

/**
 * Mutations that only need to invalidate backup queries on success (no extra
 * local state like poll-boost timers or pending-run tracking). Split out of
 * `AdminBackupTab` to keep that component under the file line limit.
 */
export function useAdminBackupSettingsMutations({
  t,
  invalidateBackup,
}: {
  t: TranslateFn;
  invalidateBackup: () => void;
}) {
  const onError = (e: Error) => {
    notifications.show({ title: t('backup.toasts.errorTitle'), message: e.message, color: 'red' });
  };

  const patchSettings = useMutation({
    mutationFn: async (body: { retentionCount?: number; defaultDestinationId?: string | null }) => {
      const res = await apiFetch('/api/v1/admin/backups/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? t('backup.toasts.saveSettingsFailed'));
      }
      return res.json() as Promise<unknown>;
    },
    onSuccess: () => invalidateBackup(),
    onError,
  });

  const saveDestination = useMutation({
    mutationFn: async ({
      form,
      destinationId,
    }: {
      form: DestinationFormState;
      destinationId: string | null;
    }) => {
      const isEdit = destinationId != null;
      const body = buildDestinationBody(form, isEdit, t);
      const res = await apiFetch(
        isEdit
          ? `/api/v1/admin/backup-destinations/${destinationId}`
          : '/api/v1/admin/backup-destinations',
        {
          method: isEdit ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? t('backup.toasts.saveDestinationFailed'));
      }
      return res.json() as Promise<unknown>;
    },
    onSuccess: () => {
      invalidateBackup();
      notifications.show({
        title: t('backup.toasts.destinationSavedTitle'),
        message: '',
        color: 'green',
      });
    },
    onError,
  });

  const deleteDestinationMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(`/api/v1/admin/backup-destinations/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(t('backup.toasts.deleteDestinationFailed'));
    },
    onSuccess: () => {
      invalidateBackup();
      notifications.show({
        title: t('backup.toasts.destinationDeletedTitle'),
        message: '',
        color: 'green',
      });
    },
    onError,
  });

  const patchDestinationEnabled = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const res = await apiFetch(`/api/v1/admin/backup-destinations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? t('backup.toasts.updateDestinationFailed'));
      }
      return res.json() as Promise<unknown>;
    },
    onSuccess: () => invalidateBackup(),
    onError,
  });

  const patchSchedule = useMutation({
    mutationFn: async (body: { enabled: boolean; cron?: string; tz?: string }) => {
      const res = await apiFetch('/api/v1/admin/backups/schedule', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? t('backup.toasts.updateScheduleFailed'));
      }
      return res.json() as Promise<unknown>;
    },
    onSuccess: () => {
      invalidateBackup();
      notifications.show({
        title: t('backup.toasts.scheduleUpdatedTitle'),
        message: '',
        color: 'green',
      });
    },
    onError,
  });

  const deleteBackup = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(`/api/v1/admin/backups/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? t('backup.toasts.deleteBackupFailed'));
      }
    },
    onSuccess: () => {
      invalidateBackup();
      notifications.show({
        title: t('backup.toasts.backupDeletedTitle'),
        message: '',
        color: 'green',
      });
    },
    onError,
  });

  const deleteFailedBackup = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(`/api/v1/admin/backups/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? t('backup.toasts.deleteBackupRunFailed'));
      }
    },
    onSuccess: () => {
      invalidateBackup();
      notifications.show({
        title: t('backup.toasts.backupRunRemovedTitle'),
        message: '',
        color: 'green',
      });
    },
    onError,
  });

  return {
    patchSettings,
    saveDestination,
    deleteDestinationMutation,
    patchDestinationEnabled,
    patchSchedule,
    deleteBackup,
    deleteFailedBackup,
  };
}
