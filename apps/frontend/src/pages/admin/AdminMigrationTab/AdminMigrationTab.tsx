import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Button, Group, Loader, Stack, Tooltip } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { IconDownload, IconUpload } from '@tabler/icons-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../../api/client';
import { useSetAppShellBreadcrumbActions } from '../../../components/appShell/AppShellBreadcrumbsContext.js';
import { WIDE_MIN_WIDTH } from '../../../components/appShell/appShellLayoutConstants.js';
import { type PageMobileAction } from '../../../components/ui/PageMobileActionBar.js';
import { useRegisterPageMobileExtraActions } from '../../../components/ui/pageMobileNav.js';
import { AdminMigrationExportModal } from './AdminMigrationExportModal';
import { AdminMigrationImportModal } from './AdminMigrationImportModal';
import { AdminMigrationOverview } from './AdminMigrationOverview';
import { AdminMigrationStatusAlerts } from './AdminMigrationStatusAlerts';
import type { PlatformMigrationStatus } from './adminMigrationTypes';
import { getMigrationStatusRefetchIntervalMs } from './migrationRunPolling';
import { getExportDisabledReason, getImportDisabledReason } from './migrationUiHelpers';

export function AdminMigrationTab() {
  const { t } = useTranslation('admin');
  const isWide = useMediaQuery(WIDE_MIN_WIDTH) ?? true;
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
  const exportDisabledReason = getExportDisabledReason(status, statusQuery.isLoading, t);
  const importDisabledReason = getImportDisabledReason(status, statusQuery.isLoading, t);
  const exportDisabled = exportDisabledReason != null;
  const importDisabled = importDisabledReason != null;

  const mobileExtraActions = useMemo(
    (): PageMobileAction[] => [
      {
        key: 'import',
        label: t('actions.importPlatform'),
        icon: <IconUpload size={16} stroke={1.5} />,
        tone: 'secondary',
        disabled: importDisabled,
        onClick: openImport,
      },
      {
        key: 'export',
        label: t('actions.exportPlatform'),
        icon: <IconDownload size={16} stroke={1.5} />,
        tone: 'secondary',
        disabled: exportDisabled,
        onClick: openExport,
      },
    ],
    [exportDisabled, importDisabled, openExport, openImport, t]
  );
  useRegisterPageMobileExtraActions(mobileExtraActions, !isWide);

  const chromeActions = useMemo(
    () => (
      <Group gap="sm" align="center" wrap="nowrap">
        <Tooltip
          label={exportDisabledReason ?? ''}
          disabled={!exportDisabled || !exportDisabledReason}
        >
          <Button size="xs" disabled={exportDisabled} onClick={openExport}>
            {t('actions.exportPlatform')}
          </Button>
        </Tooltip>
        <Tooltip
          label={importDisabledReason ?? ''}
          disabled={!importDisabled || !importDisabledReason}
        >
          <Button size="xs" variant="default" disabled={importDisabled} onClick={openImport}>
            {t('actions.importPlatform')}
          </Button>
        </Tooltip>
      </Group>
    ),
    [
      exportDisabled,
      exportDisabledReason,
      importDisabled,
      importDisabledReason,
      openExport,
      openImport,
      t,
    ]
  );
  useSetAppShellBreadcrumbActions(
    isWide ? chromeActions : null,
    `admin-migration:${exportDisabled}:${importDisabled}`
  );

  return (
    <Stack gap="md">
      {statusQuery.isError ? (
        <Alert color="red" variant="filled">
          {t('migration.loadError')}
        </Alert>
      ) : statusQuery.isPending ? (
        <Loader size="sm" />
      ) : status ? (
        <>
          <AdminMigrationStatusAlerts status={status} />
          <AdminMigrationOverview status={status} />
        </>
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
