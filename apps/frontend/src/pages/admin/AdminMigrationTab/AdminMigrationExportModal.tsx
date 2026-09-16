import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Loader, Modal, Stack, Text, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../../api/client';
import { readApiErrorMessage } from '../../../api/readApiErrorMessage';
import {
  type PlatformExportRun,
  formatBytes,
  formatPlatformExportStatus,
  isInProgressPlatformExportStatus,
} from './adminMigrationTypes';
import { triggerPlatformExportDownload } from './migrationUiHelpers';
import { MigrationWizardFooter } from './MigrationWizardFooter';
import { MigrationWizardLayout } from './MigrationWizardLayout';
import { isTerminalExportStatus, MIGRATION_RUN_POLL_INTERVAL_MS } from './migrationRunPolling';

type Props = {
  opened: boolean;
  onClose: () => void;
};

export function AdminMigrationExportModal({ opened, onClose }: Props) {
  const { t } = useTranslation('admin');
  const queryClient = useQueryClient();
  const [activeStep, setActiveStep] = useState(0);
  const [exportRunId, setExportRunId] = useState<string | null>(null);
  const [receiveUrl, setReceiveUrl] = useState('');
  const [pushSucceeded, setPushSucceeded] = useState(false);
  const autoDownloadedRef = useRef<string | null>(null);

  const EXPORT_WIZARD_STEPS = [
    {
      label: t('migration.exportModal.steps.overview.label'),
      description: t('migration.exportModal.steps.overview.description'),
    },
    {
      label: t('migration.exportModal.steps.confirm.label'),
      description: t('migration.exportModal.steps.confirm.description'),
    },
    {
      label: t('migration.exportModal.steps.progress.label'),
      description: t('migration.exportModal.steps.progress.description'),
    },
    {
      label: t('migration.exportModal.steps.done.label'),
      description: t('migration.exportModal.steps.done.description'),
    },
  ];

  const exportRunQuery = useQuery({
    queryKey: ['admin', 'platform-exports', exportRunId],
    queryFn: async () => {
      if (!exportRunId) throw new Error('No export run');
      const res = await apiFetch(`/api/v1/admin/platform-exports/${exportRunId}`);
      if (!res.ok) throw new Error('Failed to load export status');
      return res.json() as Promise<PlatformExportRun>;
    },
    enabled: opened && exportRunId != null && activeStep >= 2,
    refetchInterval: (query) => {
      const run = query.state.data;
      if (!run || isTerminalExportStatus(run.status)) return false;
      return MIGRATION_RUN_POLL_INTERVAL_MS;
    },
  });

  const exportRun = exportRunQuery.data;

  useEffect(() => {
    if (!exportRun || activeStep < 2) return;
    if (isInProgressPlatformExportStatus(exportRun.status)) {
      setActiveStep(2);
      return;
    }
    if (exportRun.status === 'succeeded' || exportRun.status === 'failed') {
      setActiveStep(3);
    }
  }, [exportRun, activeStep]);

  useEffect(() => {
    if (!exportRun || exportRun.status !== 'succeeded' || activeStep !== 3) return;
    if (autoDownloadedRef.current === exportRun.id) return;
    autoDownloadedRef.current = exportRun.id;
    triggerPlatformExportDownload(exportRun.id);
  }, [exportRun, activeStep]);

  const exportMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch('/api/v1/admin/platform-exports', { method: 'POST' });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? 'Failed to start export');
      }
      return res.json() as Promise<{ platformExportRunId: string }>;
    },
    onSuccess: (data) => {
      setExportRunId(data.platformExportRunId);
      setActiveStep(2);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'platform-migration', 'status'] });
    },
    onError: (err: Error) => {
      notifications.show({
        title: t('migration.exportModal.failedTitle'),
        message: err.message,
        color: 'red',
      });
    },
  });

  const pushMutation = useMutation({
    mutationFn: async () => {
      if (!exportRunId) throw new Error('No export run');
      const res = await apiFetch(`/api/v1/admin/platform-exports/${exportRunId}/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiveUrl: receiveUrl.trim() }),
      });
      if (!res.ok) {
        throw new Error(await readApiErrorMessage(res, t('migration.exportModal.pushFailed')));
      }
      return res.json() as Promise<{ ok: true; bytesPushed: number | null }>;
    },
    onSuccess: () => {
      setPushSucceeded(true);
      notifications.show({
        color: 'green',
        message: t('migration.exportModal.pushSucceeded'),
      });
    },
    onError: (err: Error) => {
      notifications.show({
        color: 'red',
        title: t('migration.exportModal.pushFailed'),
        message: err.message,
      });
    },
  });

  const handleClose = () => {
    setActiveStep(0);
    setExportRunId(null);
    setReceiveUrl('');
    setPushSucceeded(false);
    autoDownloadedRef.current = null;
    onClose();
  };

  useEffect(() => {
    if (!opened) {
      setActiveStep(0);
      setExportRunId(null);
      setReceiveUrl('');
      setPushSucceeded(false);
      autoDownloadedRef.current = null;
    }
  }, [opened]);

  const stepContent = (() => {
    if (activeStep === 0) {
      return (
        <Stack gap="sm">
          <Text size="sm">
            {t('migration.exportModal.overviewDescriptionBefore')}{' '}
            <code>docsops-platform-export-*.tar.zst</code>{' '}
            {t('migration.exportModal.overviewDescriptionAfter')}
          </Text>
          <Alert
            color="red"
            variant="filled"
            title={t('migration.exportModal.notDisasterRecoveryTitle')}
          >
            {t('migration.exportModal.notDisasterRecoveryBefore')}{' '}
            <Link to="/admin/data/backup">{t('nav.backup')}</Link>{' '}
            {t('migration.exportModal.notDisasterRecoveryAfter')}
          </Alert>
        </Stack>
      );
    }

    if (activeStep === 1) {
      return (
        <Alert color="blue" variant="light">
          {t('migration.exportModal.jobDurationHint')}
        </Alert>
      );
    }

    if (activeStep === 2) {
      return (
        <Stack gap="sm" align="center">
          <Loader size="sm" />
          <Text size="sm">
            {exportRun
              ? formatPlatformExportStatus(exportRun.status, t)
              : t('migration.exportModal.startingExport')}
          </Text>
          {exportRun?.status === 'packaging' ? (
            <Text size="xs" c="dimmed">
              {t('migration.exportModal.packagingHint')}
            </Text>
          ) : null}
        </Stack>
      );
    }

    if (activeStep === 3 && exportRun) {
      if (exportRun.status === 'succeeded') {
        return (
          <Stack gap="sm">
            <Alert color="green" variant="filled" title={t('migration.exportModal.completeTitle')}>
              {t('migration.exportModal.archiveSize', { size: formatBytes(exportRun.sizeBytes) })}
            </Alert>
            <Text size="sm" c="dimmed">
              {t('migration.exportModal.downloadAutoHint')}
            </Text>
            <Stack gap="xs">
              <Text size="sm" fw={600}>
                {t('migration.exportModal.pushTitle')}
              </Text>
              <Text size="sm" c="dimmed">
                {t('migration.exportModal.pushDescription')}
              </Text>
              <TextInput
                label={t('migration.exportModal.receiveUrlLabel')}
                placeholder="https://target.example/api/v1/platform-import-receive/…"
                value={receiveUrl}
                onChange={(event) => setReceiveUrl(event.currentTarget.value)}
                disabled={pushSucceeded || pushMutation.isPending}
              />
              <Button
                variant="default"
                loading={pushMutation.isPending}
                disabled={!receiveUrl.trim() || pushSucceeded}
                onClick={() => pushMutation.mutate()}
              >
                {pushSucceeded
                  ? t('migration.exportModal.pushSucceeded')
                  : t('migration.exportModal.pushSubmit')}
              </Button>
            </Stack>
          </Stack>
        );
      }

      return (
        <Alert color="red" title={t('migration.exportModal.failedTitle')}>
          {exportRun.errorMessage ?? t('migration.exportModal.unknownError')}
        </Alert>
      );
    }

    return null;
  })();

  const footer = (() => {
    if (activeStep === 0) {
      return (
        <MigrationWizardFooter
          onCancel={handleClose}
          showPrimary
          primaryLabel={t('migration.exportModal.continue')}
          onPrimary={() => setActiveStep(1)}
        />
      );
    }

    if (activeStep === 1) {
      return (
        <MigrationWizardFooter
          onCancel={handleClose}
          showBack
          onBack={() => setActiveStep(0)}
          showPrimary
          primaryLabel={t('migration.exportModal.startExport')}
          onPrimary={() => exportMutation.mutate()}
          primaryLoading={exportMutation.isPending}
        />
      );
    }

    if (activeStep === 3 && exportRun?.status === 'succeeded') {
      return (
        <MigrationWizardFooter
          secondaryLabel={t('migration.exportModal.downloadAgain')}
          onSecondary={() => triggerPlatformExportDownload(exportRun.id)}
          showPrimary
          primaryLabel={t('migration.exportModal.done')}
          onPrimary={handleClose}
        />
      );
    }

    if (activeStep === 3 && exportRun?.status === 'failed') {
      return (
        <MigrationWizardFooter onCancel={handleClose} cancelLabel={t('migration.footer.close')} />
      );
    }

    return null;
  })();

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={t('migration.exportModal.title')}
      size="xl"
      closeOnClickOutside={activeStep < 2}
    >
      <MigrationWizardLayout activeStep={activeStep} steps={EXPORT_WIZARD_STEPS} footer={footer}>
        {stepContent}
      </MigrationWizardLayout>
    </Modal>
  );
}
