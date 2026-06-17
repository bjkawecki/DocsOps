import { useMemo } from 'react';
import { Loader, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { apiFetch } from '../../../api/client';
import { AdminBackupDestinationsManageModal } from './AdminBackupDestinationsManageModal';
import { type DestinationFormState } from './AdminBackupDestinationModal';
import { AdminBackupEnableAutoModal } from './AdminBackupEnableAutoModal';
import { AdminBackupHistorySection } from './AdminBackupHistorySection';
import { AdminBackupOverviewBar } from './AdminBackupOverviewBar';
import { AdminBackupStatusAlerts } from './AdminBackupStatusAlerts';
import { type BackupRun, type BackupStatus, type Destination } from './adminBackupTypes';
import { buildDestinationBody } from './buildDestinationBody';

const DEFAULT_AUTO_CRON = '0 3 * * *';
const DEFAULT_AUTO_TZ = 'UTC';

export function AdminBackupTab() {
  const queryClient = useQueryClient();
  const [manageOpened, { open: openManage, close: closeManage }] = useDisclosure(false);
  const [enableAutoOpened, { open: openEnableAuto, close: closeEnableAuto }] = useDisclosure(false);

  const statusQuery = useQuery({
    queryKey: ['admin', 'backups', 'status'],
    queryFn: async (): Promise<BackupStatus> => {
      const res = await apiFetch('/api/v1/admin/backups/status');
      if (!res.ok) throw new Error('Failed to load backup status');
      return (await res.json()) as BackupStatus;
    },
    refetchInterval: (q) => {
      const runs = queryClient.getQueryData<{ items: BackupRun[] }>(['admin', 'backups', 'runs']);
      const active = runs?.items?.some((r) => r.status === 'running' || r.status === 'uploading');
      return active || q.state.data?.maintenanceActive ? 3000 : 15000;
    },
  });

  const destinationsQuery = useQuery({
    queryKey: ['admin', 'backups', 'destinations'],
    queryFn: async () => {
      const res = await apiFetch('/api/v1/admin/backup-destinations');
      if (!res.ok) throw new Error('Failed to load destinations');
      return (await res.json()) as { items: Destination[] };
    },
  });

  const runsQuery = useQuery({
    queryKey: ['admin', 'backups', 'runs'],
    queryFn: async () => {
      const res = await apiFetch('/api/v1/admin/backups?limit=25&offset=0');
      if (!res.ok) throw new Error('Failed to load backups');
      return (await res.json()) as { items: BackupRun[] };
    },
    refetchInterval: () => {
      const runs = queryClient.getQueryData<{ items: BackupRun[] }>(['admin', 'backups', 'runs']);
      const active = runs?.items?.some((r) => r.status === 'running' || r.status === 'uploading');
      return active ? 3000 : false;
    },
  });

  const invalidateBackup = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'backups'] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'jobs', 'schedules'] });
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
        throw new Error(err.error ?? 'Failed to save settings');
      }
      return res.json() as Promise<unknown>;
    },
    onSuccess: () => {
      invalidateBackup();
    },
    onError: (e: Error) => {
      notifications.show({ title: 'Error', message: e.message, color: 'red' });
    },
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
      const body = buildDestinationBody(form, isEdit);
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
        throw new Error(err.error ?? 'Failed to save destination');
      }
      return res.json() as Promise<unknown>;
    },
    onSuccess: () => {
      invalidateBackup();
      notifications.show({ title: 'Destination saved', message: '', color: 'green' });
    },
    onError: (e: Error) => {
      notifications.show({ title: 'Error', message: e.message, color: 'red' });
    },
  });

  const deleteDestinationMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(`/api/v1/admin/backup-destinations/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete destination');
    },
    onSuccess: () => {
      invalidateBackup();
      notifications.show({ title: 'Destination deleted', message: '', color: 'green' });
    },
    onError: (e: Error) => {
      notifications.show({ title: 'Error', message: e.message, color: 'red' });
    },
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
        throw new Error(err.error ?? 'Failed to update schedule');
      }
      return res.json() as Promise<unknown>;
    },
    onSuccess: () => {
      invalidateBackup();
      notifications.show({ title: 'Schedule updated', message: '', color: 'green' });
    },
    onError: (e: Error) => {
      notifications.show({ title: 'Error', message: e.message, color: 'red' });
    },
  });

  const createBackup = useMutation({
    mutationFn: async (destinationId?: string) => {
      const res = await apiFetch('/api/v1/admin/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(destinationId ? { destinationId } : {}),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? 'Failed to start backup');
      }
      return res.json() as Promise<unknown>;
    },
    onSuccess: () => {
      invalidateBackup();
      notifications.show({ title: 'Backup started', message: '', color: 'green' });
    },
    onError: (e: Error) => {
      notifications.show({ title: 'Error', message: e.message, color: 'red' });
    },
  });

  const downloadBackup = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(`/api/v1/admin/backups/${id}/download`);
      if (!res.ok) throw new Error('Download not available');
      return (await res.json()) as { url: string };
    },
    onSuccess: (data) => {
      window.open(data.url, '_blank', 'noopener,noreferrer');
    },
    onError: (e: Error) => {
      notifications.show({ title: 'Error', message: e.message, color: 'red' });
    },
  });

  const destinations = useMemo(
    () => destinationsQuery.data?.items ?? [],
    [destinationsQuery.data?.items]
  );

  if (statusQuery.isPending) return <Loader size="sm" />;

  const status = statusQuery.data;
  if (!status) return null;

  const canBackup =
    status.minioAvailable && status.encryptionConfigured && !status.maintenanceActive;

  const canEnableAuto =
    status.encryptionConfigured && status.defaultDestinationId != null && status.minioAvailable;

  const enableBlockReason = !status.encryptionConfigured
    ? 'BACKUP_ENCRYPTION_KEY is not configured'
    : !status.defaultDestinationId
      ? 'Set a default destination first'
      : !status.minioAvailable
        ? 'Object storage is unavailable'
        : null;

  return (
    <Stack gap="md">
      <AdminBackupStatusAlerts status={status} />

      <AdminBackupOverviewBar
        status={status}
        destinations={destinations}
        retentionCount={status.retentionCount}
        onRetentionChange={(retentionCount) => patchSettings.mutate({ retentionCount })}
        onDefaultDestinationChange={(defaultDestinationId) =>
          patchSettings.mutate({ defaultDestinationId })
        }
        canBackup={canBackup}
        canEnableAuto={canEnableAuto}
        enableBlockReason={enableBlockReason}
        scheduleSaving={patchSchedule.isPending}
        backupLoading={createBackup.isPending}
        onAutoToggle={(enabled) => {
          if (enabled) {
            openEnableAuto();
          } else {
            patchSchedule.mutate({ enabled: false });
          }
        }}
        onManageDestinations={openManage}
        onBackupNow={() => createBackup.mutate(status.defaultDestinationId ?? undefined)}
      />

      <AdminBackupHistorySection
        runs={runsQuery.data?.items}
        loading={runsQuery.isPending}
        downloadLoading={downloadBackup.isPending}
        onDownload={(id) => downloadBackup.mutate(id)}
      />

      <AdminBackupDestinationsManageModal
        opened={manageOpened}
        onClose={closeManage}
        destinations={destinations}
        defaultDestinationId={status.defaultDestinationId}
        savingDestination={saveDestination.isPending}
        deletingDestination={deleteDestinationMutation.isPending}
        onSaveDestination={async (form, destinationId) => {
          await saveDestination.mutateAsync({ form, destinationId });
        }}
        onDeleteDestination={(d) => deleteDestinationMutation.mutate(d.id)}
      />

      <AdminBackupEnableAutoModal
        opened={enableAutoOpened}
        onClose={closeEnableAuto}
        loading={patchSchedule.isPending}
        onConfirm={() => {
          patchSchedule.mutate(
            { enabled: true, cron: DEFAULT_AUTO_CRON, tz: DEFAULT_AUTO_TZ },
            { onSuccess: () => closeEnableAuto() }
          );
        }}
      />
    </Stack>
  );
}
