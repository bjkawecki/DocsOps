import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Button, Group, Loader, Stack, Tooltip } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconRefresh } from '@tabler/icons-react';
import { useSetAppShellBreadcrumbActions } from '../../../components/appShell/AppShellBreadcrumbsContext.js';
import {
  useAdminSystemSettings,
  useCheckForUpdates,
  useAdminUpdateStatus,
  usePatchAdminSystemSettings,
} from '../../../hooks/useAdminUpdateStatus.js';
import { AdminSystemOverviewBar } from './AdminSystemOverviewBar.js';
import { AdminSystemStatusAlerts } from './AdminSystemStatusAlerts.js';
import { AdminSystemApplyUpdateModal } from './AdminSystemApplyUpdateModal.js';
import { AdminSystemUpcomingReleasePreview } from './AdminSystemUpcomingReleasePreview.js';
import { AdminSystemUpdateStepsModal } from './AdminSystemUpdateStepsModal.js';
import { AdminSystemVersionTable } from './AdminSystemVersionTable.js';

export function AdminSystemTab() {
  const { t } = useTranslation('admin');
  const statusQuery = useAdminUpdateStatus();
  const settingsQuery = useAdminSystemSettings();
  const checkMutation = useCheckForUpdates();
  const patchSettingsMutation = usePatchAdminSystemSettings();
  const [stepsOpened, { open: openSteps, close: closeSteps }] = useDisclosure(false);
  const [applyOpened, { open: openApply, close: closeApply }] = useDisclosure(false);
  const status = statusQuery.data;
  const checksEnabled = settingsQuery.data?.updateCheckEnabled ?? true;
  const checkDisabled =
    statusQuery.isFetching || !checksEnabled || checkMutation.isPending || status == null;

  const handleCheck = useCallback(async () => {
    try {
      const result = await checkMutation.mutateAsync();
      if (result.notificationSent) {
        notifications.show({
          color: 'blue',
          message: 'Admins were notified about the available update.',
        });
      } else if (result.status.updateAvailable) {
        notifications.show({ color: 'green', message: 'Update check completed.' });
      } else {
        notifications.show({ color: 'green', message: 'DocsOps is up to date.' });
      }
    } catch {
      notifications.show({ color: 'red', message: 'Update check failed.' });
    }
  }, [checkMutation]);

  const handleToggleChecks = async (enabled: boolean) => {
    try {
      await patchSettingsMutation.mutateAsync({ updateCheckEnabled: enabled });
      notifications.show({
        color: 'green',
        message: enabled ? 'Automatic update checks enabled.' : 'Automatic update checks disabled.',
      });
    } catch {
      notifications.show({ color: 'red', message: 'Could not update settings.' });
    }
  };

  const canApplyUpdate = status?.canApplyUpdate === true;
  const chromeActions = useMemo(
    () => (
      <Group gap="sm" align="center" wrap="nowrap">
        <Button size="xs" variant="default" onClick={openSteps} disabled={status == null}>
          {t('actions.howToUpdate')}
        </Button>
        {canApplyUpdate ? (
          <Button size="xs" color="orange" onClick={openApply}>
            {t('actions.applyUpdate')}
          </Button>
        ) : null}
        <Tooltip
          label={!checksEnabled ? 'Enable automatic checks first' : undefined}
          disabled={checksEnabled}
        >
          <Button
            size="xs"
            leftSection={<IconRefresh size={14} />}
            loading={checkMutation.isPending}
            disabled={checkDisabled}
            onClick={() => void handleCheck()}
          >
            {t('actions.checkForUpdates')}
          </Button>
        </Tooltip>
      </Group>
    ),
    [
      canApplyUpdate,
      checkDisabled,
      checkMutation.isPending,
      checksEnabled,
      handleCheck,
      openApply,
      openSteps,
      status,
      t,
    ]
  );
  useSetAppShellBreadcrumbActions(
    chromeActions,
    `admin-system:${checksEnabled}:${checkDisabled}:${canApplyUpdate}:${checkMutation.isPending}`
  );

  return (
    <Stack gap="md">
      {statusQuery.isError ? (
        <Alert color="red" variant="filled">
          Could not load update status. Reload the page or try again later.
        </Alert>
      ) : statusQuery.isPending || settingsQuery.isPending ? (
        <Loader size="sm" />
      ) : status ? (
        <>
          <AdminSystemStatusAlerts status={status} />
          <AdminSystemOverviewBar
            status={status}
            checksEnabled={checksEnabled}
            settingsSaving={patchSettingsMutation.isPending}
            onToggleChecks={(enabled) => void handleToggleChecks(enabled)}
          />
          <AdminSystemVersionTable status={status} />
          <AdminSystemUpcomingReleasePreview status={status} />
        </>
      ) : null}

      {status ? (
        <>
          <AdminSystemUpdateStepsModal
            opened={stepsOpened}
            onClose={closeSteps}
            latestReleaseTag={status.latestReleaseTag}
            releaseUrl={status.releaseUrl}
            agentConfigured={status.agentConfigured}
            agentMissingEnvVars={status.agentMissingEnvVars}
          />
          <AdminSystemApplyUpdateModal opened={applyOpened} onClose={closeApply} status={status} />
        </>
      ) : null}
    </Stack>
  );
}
