import {
  Alert,
  Button,
  Code,
  Group,
  Modal,
  ScrollArea,
  Stack,
  Stepper,
  Text,
  ThemeIcon,
} from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AdminSystemUpdateStatus, AdminUpdateRun } from 'backend/api-types';
import { useApplySystemUpdate, usePollUpdateRun } from '../../../hooks/useAdminUpdateStatus.js';
import {
  UPDATE_PROGRESS_STEP_COUNT,
  agentPhaseStepIndex,
  formatUpdateElapsedSince,
  getUpdateProgressSteps,
  isRestartPhase,
  updateProgressStepIndex,
} from './updateProgressSteps.js';
import { openUpdateStatusPage } from './updateStatusPageUrl.js';

type Props = {
  opened: boolean;
  onClose: () => void;
  status: AdminSystemUpdateStatus;
};

function resolveActiveRun(
  status: AdminSystemUpdateStatus,
  polledRun: AdminUpdateRun | undefined
): AdminUpdateRun | null {
  if (polledRun != null) return polledRun;
  return status.activeUpdateRun;
}

export function AdminSystemApplyUpdateModal({ opened, onClose, status }: Props) {
  const { t } = useTranslation('admin');
  const [failedMessage, setFailedMessage] = useState<string | null>(null);
  const [trackingRunId, setTrackingRunId] = useState<string | null>(null);
  const [dismissedSuccessRunId, setDismissedSuccessRunId] = useState<string | null>(null);
  const applyMutation = useApplySystemUpdate();

  const updateProgressSteps = useMemo(() => getUpdateProgressSteps(t), [t]);

  const pollQuery = usePollUpdateRun(trackingRunId, {
    enabled: opened && trackingRunId != null,
  });

  const activeRun = resolveActiveRun(status, pollQuery.data);
  const inProgress =
    activeRun != null &&
    (activeRun.status === 'queued' ||
      activeRun.status === 'backing_up' ||
      activeRun.status === 'applying');

  const showSuccess =
    activeRun?.status === 'succeeded' &&
    trackingRunId != null &&
    activeRun.id === trackingRunId &&
    dismissedSuccessRunId !== trackingRunId;

  const showProgress = inProgress && activeRun != null;

  const isRestarting =
    showProgress &&
    (isRestartPhase(activeRun?.agentPhase) || (pollQuery.isError && trackingRunId != null));

  useEffect(() => {
    if (!opened) {
      setFailedMessage(null);
    }
  }, [opened]);

  useEffect(() => {
    if (opened && status.activeUpdateRun?.id) {
      setTrackingRunId(status.activeUpdateRun.id);
    }
  }, [opened, status.activeUpdateRun?.id]);

  useEffect(() => {
    if (activeRun?.status === 'failed' && activeRun.errorMessage) {
      setFailedMessage(activeRun.errorMessage);
    }
  }, [activeRun?.status, activeRun?.errorMessage]);

  const stepIndex = useMemo(() => {
    if (activeRun == null) return -1;
    if (activeRun.status === 'succeeded') {
      return UPDATE_PROGRESS_STEP_COUNT;
    }
    if (activeRun.status === 'applying' && activeRun.agentPhase) {
      return agentPhaseStepIndex(activeRun.agentPhase);
    }
    return updateProgressStepIndex(activeRun.status);
  }, [activeRun]);

  const elapsed = formatUpdateElapsedSince(activeRun?.startedAt ?? null, Date.now(), t);

  const handleDismissSuccess = () => {
    if (trackingRunId != null) {
      setDismissedSuccessRunId(trackingRunId);
    }
    onClose();
  };

  const handleClose = () => {
    if (applyMutation.isPending || inProgress) return;
    if (showSuccess) {
      handleDismissSuccess();
      return;
    }
    onClose();
  };

  const handleApply = async () => {
    try {
      const result = await applyMutation.mutateAsync();
      setTrackingRunId(result.updateRunId);
      setDismissedSuccessRunId(null);
      setFailedMessage(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t('system.applyUpdateModal.startFailedFallback');
      setFailedMessage(message);
    }
  };

  const tag = status.latestReleaseTag ?? 'vX.Y.Z';
  const showRunFailure = failedMessage != null && !inProgress && !showSuccess;

  const modalTitle = showRunFailure
    ? t('system.applyUpdateModal.titleFailed')
    : showSuccess
      ? t('system.applyUpdateModal.titleCompleted')
      : showProgress
        ? t('system.applyUpdateModal.titleUpdating')
        : t('system.applyUpdateModal.titleDefault');

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={modalTitle}
      size="md"
      closeOnClickOutside={!applyMutation.isPending && !inProgress}
      closeOnEscape={!applyMutation.isPending && !inProgress}
    >
      {showRunFailure ? (
        <Stack gap="md">
          <Alert color="red" title={t('system.applyUpdateModal.titleFailed')}>
            <ScrollArea.Autosize mah={280}>
              <Code block style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {failedMessage}
              </Code>
            </ScrollArea.Autosize>
          </Alert>
          <Group justify="flex-end">
            <Button onClick={handleClose}>{t('system.applyUpdateModal.close')}</Button>
          </Group>
        </Stack>
      ) : showSuccess && activeRun != null ? (
        <Stack gap="md">
          <Text size="sm">
            {t('system.applyUpdateModal.upgradedMessage', {
              version: activeRun.targetReleaseTag,
            })}
          </Text>
          <Stepper active={UPDATE_PROGRESS_STEP_COUNT} size="sm" orientation="vertical">
            {updateProgressSteps.map((step) => (
              <Stepper.Step key={step.key} label={step.label} description={step.detail} />
            ))}
            <Stepper.Completed>{t('system.applyUpdateModal.allStepsFinished')}</Stepper.Completed>
          </Stepper>
          <Group justify="flex-end">
            <Button variant="default" onClick={handleDismissSuccess}>
              {t('system.applyUpdateModal.close')}
            </Button>
            <Button onClick={() => window.location.reload()}>
              {t('system.applyUpdateModal.reloadPage')}
            </Button>
          </Group>
        </Stack>
      ) : showProgress ? (
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            {t('system.applyUpdateModal.upgradingTo', { version: activeRun.targetReleaseTag })}
            {elapsed != null ? ` · ${elapsed}` : ''}
          </Text>
          {isRestarting ? (
            <Group gap="xs" wrap="nowrap" align="flex-start">
              <ThemeIcon variant="light" color="blue" size="sm" radius="xl" mt={2}>
                <IconInfoCircle size={14} aria-hidden />
              </ThemeIcon>
              <Text size="sm" c="dimmed">
                {t('system.applyUpdateModal.restartingHint')}
              </Text>
            </Group>
          ) : (
            <Text size="sm" c="dimmed">
              {t('system.applyUpdateModal.canCloseHint')}
            </Text>
          )}
          <Stepper active={Math.max(0, stepIndex)} size="sm" orientation="vertical">
            {updateProgressSteps.map((step, index) => (
              <Stepper.Step
                key={step.key}
                label={step.label}
                description={step.detail}
                loading={index === stepIndex && inProgress}
              />
            ))}
          </Stepper>
          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={() =>
                openUpdateStatusPage(activeRun.targetReleaseTag, status.installedVersion)
              }
            >
              {t('system.applyUpdateModal.openStatusPage')}
            </Button>
          </Group>
        </Stack>
      ) : (
        <Stack gap="md">
          <Text size="sm">{t('system.applyUpdateModal.backupAndUpgradeMessage', { tag })}</Text>
          <Stack gap={4}>
            {updateProgressSteps.map((step) => (
              <Text key={step.key} size="sm" c="dimmed">
                • {step.label}
              </Text>
            ))}
          </Stack>
          <Group justify="flex-end">
            <Button variant="default" onClick={handleClose}>
              {t('system.applyUpdateModal.cancel')}
            </Button>
            <Button loading={applyMutation.isPending} onClick={() => void handleApply()}>
              {t('system.applyUpdateModal.startUpdate')}
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}
