import { Alert, Loader, Stack, Text } from '@mantine/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../../api/client';
import { AdminDemoReadOnlyAlert, useDemoMode } from '../AdminDemoReadOnlyAlert.js';
import { AdminBackupDestinationsPanel } from '../AdminBackupTab/AdminBackupDestinationsPanel';
import {
  buildDestinationBody,
  type DestinationFormState,
} from '../AdminBackupTab/adminBackupDestinationForm';
import type { BackupStatus, Destination } from '../AdminBackupTab/adminBackupTypes';

export function AdminDestinationsTab() {
  const { t } = useTranslation(['admin', 'common']);
  const queryClient = useQueryClient();
  const demoMode = useDemoMode();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'backups'] });
  };

  const destinationsQuery = useQuery({
    queryKey: ['admin', 'backups', 'destinations'],
    queryFn: async () => {
      const res = await apiFetch('/api/v1/admin/backup-destinations');
      if (!res.ok) throw new Error(t('destinations.toasts.loadFailed'));
      return (await res.json()) as { items: Destination[] };
    },
  });

  const backupStatusQuery = useQuery({
    queryKey: ['admin', 'backups', 'status'],
    queryFn: async () => {
      const res = await apiFetch('/api/v1/admin/backups/status');
      if (!res.ok) throw new Error(t('destinations.toasts.loadFailed'));
      return (await res.json()) as BackupStatus;
    },
  });

  const onError = (e: Error) => {
    notifications.show({
      title: t('destinations.toasts.errorTitle'),
      message: e.message,
      color: 'red',
    });
  };

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
        throw new Error(err.error ?? t('destinations.toasts.saveFailed'));
      }
    },
    onSuccess: () => {
      invalidate();
      notifications.show({
        title: t('destinations.toasts.savedTitle'),
        message: '',
        color: 'green',
      });
    },
    onError,
  });

  const deleteDestination = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(`/api/v1/admin/backup-destinations/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(t('destinations.toasts.deleteFailed'));
    },
    onSuccess: () => {
      invalidate();
      notifications.show({
        title: t('destinations.toasts.deletedTitle'),
        message: '',
        color: 'green',
      });
    },
    onError,
  });

  const patchEnabled = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const res = await apiFetch(`/api/v1/admin/backup-destinations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? t('destinations.toasts.updateFailed'));
      }
    },
    onSuccess: () => invalidate(),
    onError,
  });

  const setBackupDefault = useMutation({
    mutationFn: async (destinationId: string) => {
      const res = await apiFetch('/api/v1/admin/backups/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaultDestinationId: destinationId }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? t('destinations.toasts.setDefaultFailed'));
      }
    },
    onSuccess: () => {
      invalidate();
      notifications.show({
        title: t('destinations.toasts.defaultUpdatedTitle'),
        message: '',
        color: 'green',
      });
    },
    onError,
  });

  if (destinationsQuery.isPending || backupStatusQuery.isPending) {
    return <Loader size="sm" />;
  }

  if (destinationsQuery.isError || backupStatusQuery.isError) {
    return (
      <Alert color="red" variant="filled" title={t('destinations.toasts.errorTitle')}>
        {destinationsQuery.error instanceof Error
          ? destinationsQuery.error.message
          : backupStatusQuery.error instanceof Error
            ? backupStatusQuery.error.message
            : t('common:errors.generic')}
      </Alert>
    );
  }

  return (
    <Stack gap="md">
      <AdminDemoReadOnlyAlert />
      <Text size="sm" c="dimmed">
        {t('destinations.intro')}
      </Text>
      <AdminBackupDestinationsPanel
        destinations={destinationsQuery.data?.items ?? []}
        defaultDestinationId={backupStatusQuery.data?.defaultDestinationId ?? null}
        savingDestination={saveDestination.isPending}
        deletingDestination={deleteDestination.isPending}
        togglingDestinationId={patchEnabled.isPending ? (patchEnabled.variables?.id ?? null) : null}
        onSaveDestination={async (form, destinationId) => {
          if (demoMode) return;
          await saveDestination.mutateAsync({ form, destinationId });
        }}
        onDeleteDestination={(destination) => {
          if (demoMode) return;
          deleteDestination.mutate(destination.id);
        }}
        onSetDefault={(destinationId) => {
          if (demoMode) return;
          setBackupDefault.mutate(destinationId);
        }}
        onToggleEnabled={(destinationId, enabled) => {
          if (demoMode) return;
          patchEnabled.mutate(
            { id: destinationId, enabled },
            {
              onSuccess: () => {
                if (!enabled && backupStatusQuery.data?.defaultDestinationId === destinationId) {
                  void apiFetch('/api/v1/admin/backups/settings', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ defaultDestinationId: null }),
                  }).then(() => invalidate());
                }
              },
            }
          );
        }}
      />
    </Stack>
  );
}
