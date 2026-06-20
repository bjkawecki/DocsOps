import { useEffect, useState } from 'react';
import { Alert, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../../api/client';
import { AdminMigrationExportModal } from './AdminMigrationExportModal';
import { AdminMigrationImportModal } from './AdminMigrationImportModal';
import { AdminMigrationOverview } from './AdminMigrationOverview';
import type { PlatformMigrationStatus } from './adminMigrationTypes';
import { getMigrationStatusRefetchIntervalMs } from './migrationRunPolling';

export function AdminMigrationTab() {
  const queryClient = useQueryClient();
  const [exportOpened, { open: openExport, close: closeExport }] = useDisclosure(false);
  const [importOpened, { open: openImport, close: closeImport }] = useDisclosure(false);
  const [isTabVisible, setIsTabVisible] = useState(() => document.visibilityState === 'visible');

  useEffect(() => {
    const onVisibilityChange = () => {
      const visible = document.visibilityState === 'visible';
      setIsTabVisible(visible);
      if (visible) {
        void queryClient.invalidateQueries({ queryKey: ['admin', 'platform-migration', 'status'] });
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [queryClient]);

  const statusQuery = useQuery({
    queryKey: ['admin', 'platform-migration', 'status'],
    queryFn: async () => {
      const res = await apiFetch('/api/v1/admin/platform-migration/status');
      if (!res.ok) throw new Error('Failed to load migration status');
      return res.json() as Promise<PlatformMigrationStatus>;
    },
    refetchInterval: (query) =>
      getMigrationStatusRefetchIntervalMs({
        status: query.state.data,
        isTabVisible,
      }),
  });

  const status = statusQuery.data;
  const exportDisabled =
    !status?.minioAvailable || Boolean(status?.activeExportRun) || statusQuery.isLoading;
  const importDisabled =
    Boolean(status?.activeImportRun) ||
    status?.maintenanceReason === 'platform-import' ||
    statusQuery.isLoading;

  return (
    <Stack gap="lg">
      <Alert color="blue" variant="light">
        Platform migration exports logical domain data for moving to another server or cloning a
        test instance. This is not disaster recovery. For rollback, use the Backup tab.
      </Alert>

      {statusQuery.isError ? (
        <Alert color="red">Failed to load migration status.</Alert>
      ) : status ? (
        <AdminMigrationOverview
          status={status}
          onExport={openExport}
          onImport={openImport}
          exportDisabled={exportDisabled}
          importDisabled={importDisabled}
        />
      ) : null}

      <AdminMigrationExportModal
        opened={exportOpened}
        onClose={() => {
          closeExport();
          void queryClient.invalidateQueries({
            queryKey: ['admin', 'platform-migration', 'status'],
          });
        }}
      />

      <AdminMigrationImportModal
        opened={importOpened}
        onClose={() => {
          closeImport();
          void queryClient.invalidateQueries({
            queryKey: ['admin', 'platform-migration', 'status'],
          });
        }}
      />
    </Stack>
  );
}
