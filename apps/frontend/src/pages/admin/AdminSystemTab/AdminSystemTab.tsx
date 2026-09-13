import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Button, Group, Loader, Menu, Stack, Tooltip } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconDotsVertical, IconRefresh } from '@tabler/icons-react';
import { useSetAppShellBreadcrumbActions } from '../../../components/appShell/AppShellBreadcrumbsContext.js';
import { WIDE_MIN_WIDTH } from '../../../components/appShell/appShellLayoutConstants.js';
import { type PageMobileAction } from '../../../components/ui/PageMobileActionBar.js';
import { useRegisterPageMobileExtraActions } from '../../../components/ui/pageMobileNav.js';
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
  const isWide = useMediaQuery(WIDE_MIN_WIDTH) ?? true;
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
          message: t('system.checkNotifications.adminsNotified'),
        });
      } else if (result.status.updateAvailable) {
        notifications.show({
          color: 'green',
          message: t('system.checkNotifications.checkCompleted'),
        });
      } else {
        notifications.show({ color: 'green', message: t('system.checkNotifications.upToDate') });
      }
    } catch {
      notifications.show({ color: 'red', message: t('system.checkNotifications.checkFailed') });
    }
  }, [checkMutation, t]);

  const handleToggleChecks = async (enabled: boolean) => {
    try {
      await patchSettingsMutation.mutateAsync({ updateCheckEnabled: enabled });
      notifications.show({
        color: 'green',
        message: enabled ? t('system.toggleChecks.enabled') : t('system.toggleChecks.disabled'),
      });
    } catch {
      notifications.show({ color: 'red', message: t('system.toggleChecks.saveFailed') });
    }
  };

  const canApplyUpdate = status?.canApplyUpdate === true;

  const mobileExtraActions = useMemo((): PageMobileAction[] => {
    const moreMenu = (
      <>
        <Menu.Item onClick={openSteps} disabled={status == null}>
          {t('actions.howToUpdate')}
        </Menu.Item>
        {canApplyUpdate ? (
          <Menu.Item onClick={openApply}>{t('actions.applyUpdate')}</Menu.Item>
        ) : null}
      </>
    );
    return [
      {
        key: 'more',
        label: t('actions.howToUpdate'),
        icon: <IconDotsVertical size={16} stroke={1.5} />,
        tone: 'more',
        menu: moreMenu,
      },
      {
        key: 'check-updates',
        label: t('actions.checkForUpdates'),
        icon: <IconRefresh size={16} stroke={1.5} />,
        tone: 'secondary',
        loading: checkMutation.isPending,
        disabled: checkDisabled,
        onClick: () => void handleCheck(),
      },
    ];
  }, [
    canApplyUpdate,
    checkDisabled,
    checkMutation.isPending,
    handleCheck,
    openApply,
    openSteps,
    status,
    t,
  ]);
  useRegisterPageMobileExtraActions(mobileExtraActions, !isWide);

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
          label={!checksEnabled ? t('system.checkForUpdatesTooltip') : undefined}
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
    isWide ? chromeActions : null,
    `admin-system:${checksEnabled}:${checkDisabled}:${canApplyUpdate}:${checkMutation.isPending}`
  );

  return (
    <Stack gap="md">
      {statusQuery.isError ? (
        <Alert color="red" variant="filled">
          {t('system.loadError')}
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
