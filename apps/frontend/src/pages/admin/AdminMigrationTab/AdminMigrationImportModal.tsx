import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Group,
  List,
  Loader,
  Modal,
  Stack,
  Text,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../../api/client';
import { readApiErrorMessage } from '../../../api/readApiErrorMessage';
import { useMe } from '../../../hooks/useMe';
import {
  type PlatformImportPreflight,
  type PlatformImportRun,
  formatPlatformImportStatus,
} from './adminMigrationTypes';
import { invalidatePlatformMigrationAppCache } from './invalidatePlatformMigrationAppCache';
import { MigrationRunStatsGrid } from './MigrationRunStatsGrid';
import { MigrationWizardFooter } from './MigrationWizardFooter';
import { MigrationWizardLayout } from './MigrationWizardLayout';
import { isTerminalImportStatus, MIGRATION_RUN_POLL_INTERVAL_MS } from './migrationRunPolling';
import { PlatformImportDropzone } from './PlatformImportDropzone';
import { PlatformImportPhaseList } from './PlatformImportPhaseList';

type Props = {
  opened: boolean;
  onClose: () => void;
  /** When set, skip upload and resume from an existing awaiting_confirm / preflight_failed run (e.g. push). */
  initialImportRunId?: string | null;
};

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

function uploadErrorTitleFromMessage(message: string, t: TranslateFn): string {
  const lower = message.toLowerCase();
  if (lower.includes('http 5') || lower.includes('server error')) {
    return t('migration.importModal.uploadErrorTitle.serverError');
  }
  if (lower.includes('too large')) return t('migration.importModal.uploadErrorTitle.tooLarge');
  if (lower.includes('unpack') || lower.includes('.tar.zst'))
    return t('migration.importModal.uploadErrorTitle.invalidArchive');
  if (lower.includes('minio'))
    return t('migration.importModal.uploadErrorTitle.storageUnavailable');
  return t('migration.importModal.uploadErrorTitle.uploadFailed');
}

export function AdminMigrationImportModal({ opened, onClose, initialImportRunId }: Props) {
  const { t } = useTranslation('admin');
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: me } = useMe();
  const [activeStep, setActiveStep] = useState(0);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [importRunId, setImportRunId] = useState<string | null>(null);
  const [preflight, setPreflight] = useState<PlatformImportPreflight | null>(null);
  const [transferPasswordHashes, setTransferPasswordHashes] = useState(false);
  const [merge, setMerge] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadErrorTitle, setUploadErrorTitle] = useState(
    t('migration.importModal.uploadErrorTitle.uploadFailed')
  );
  const refreshedAppCacheForRunIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!opened || !initialImportRunId) return;
    let cancelled = false;
    void (async () => {
      const res = await apiFetch(`/api/v1/admin/platform-imports/${initialImportRunId}`);
      if (!res.ok || cancelled) return;
      const run = (await res.json()) as PlatformImportRun;
      if (cancelled) return;
      setImportRunId(run.id);
      setPreflight(run.preflightJson);
      setUploadError(null);
      if (run.status === 'awaiting_confirm' && run.preflightJson?.ok) {
        setActiveStep(1);
      } else if (run.status === 'preflight_failed') {
        setActiveStep(0);
        setUploadError(run.errorMessage ?? t('migration.importModal.preflightFailedTitle'));
      } else if (
        run.status === 'queued' ||
        run.status === 'running' ||
        run.status.startsWith('importing_') ||
        run.status === 'succeeded' ||
        run.status === 'failed'
      ) {
        setActiveStep(3);
      } else {
        setActiveStep(1);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [opened, initialImportRunId, t]);

  const IMPORT_WIZARD_STEPS = [
    {
      label: t('migration.importModal.steps.upload.label'),
      description: t('migration.importModal.steps.upload.description'),
    },
    {
      label: t('migration.importModal.steps.options.label'),
      description: t('migration.importModal.steps.options.description'),
    },
    {
      label: t('migration.importModal.steps.confirm.label'),
      description: t('migration.importModal.steps.confirm.description'),
    },
    {
      label: t('migration.importModal.steps.result.label'),
      description: t('migration.importModal.steps.result.description'),
    },
  ];

  const importRunQuery = useQuery({
    queryKey: ['admin', 'platform-imports', importRunId],
    queryFn: async () => {
      if (!importRunId) throw new Error('No import run');
      const res = await apiFetch(`/api/v1/admin/platform-imports/${importRunId}`);
      if (!res.ok) throw new Error('Failed to load import status');
      return res.json() as Promise<PlatformImportRun>;
    },
    enabled: opened && importRunId != null && activeStep === 3,
    refetchInterval: (query) => {
      const run = query.state.data;
      if (!run || isTerminalImportStatus(run.status)) return false;
      return MIGRATION_RUN_POLL_INTERVAL_MS;
    },
  });

  const importRun = importRunQuery.data;
  const importInProgress =
    importRun != null && activeStep === 3 && !isTerminalImportStatus(importRun.status);

  useEffect(() => {
    if (!importRun || importRun.status !== 'succeeded') return;
    if (refreshedAppCacheForRunIdRef.current === importRun.id) return;
    refreshedAppCacheForRunIdRef.current = importRun.id;
    invalidatePlatformMigrationAppCache(queryClient);
  }, [importRun, queryClient]);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append('file', file);
      const res = await apiFetch('/api/v1/admin/platform-imports/upload', {
        method: 'POST',
        body: form,
      });
      if (!res.ok) {
        throw new Error(await readApiErrorMessage(res, 'Upload failed'));
      }
      return res.json() as Promise<{
        platformImportRunId: string;
        preflight: PlatformImportPreflight;
        status: string;
      }>;
    },
    onSuccess: (data) => {
      setUploadError(null);
      setUploadErrorTitle(t('migration.importModal.uploadErrorTitle.uploadFailed'));
      setImportRunId(data.platformImportRunId);
      setPreflight(data.preflight);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'platform-migration', 'status'] });
    },
    onError: (err: Error) => {
      setUploadErrorTitle(uploadErrorTitleFromMessage(err.message, t));
      setUploadError(err.message);
      setPreflight(null);
    },
  });

  const confirmMutation = useMutation({
    mutationFn: async () => {
      if (!importRunId) throw new Error('No import run selected');
      const res = await apiFetch(`/api/v1/admin/platform-imports/${importRunId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transferPasswordHashes, merge }),
      });
      if (!res.ok) {
        throw new Error(await readApiErrorMessage(res, 'Failed to confirm import'));
      }
      return res.json() as Promise<{ platformImportRunId: string; jobId: string }>;
    },
    onSuccess: () => {
      setActiveStep(3);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'platform-migration', 'status'] });
    },
    onError: (err: Error) => {
      notifications.show({
        title: t('migration.importModal.failedTitle'),
        message: err.message,
        color: 'red',
      });
    },
  });

  const resetState = useCallback(() => {
    setActiveStep(0);
    setUploadFile(null);
    setImportRunId(null);
    setPreflight(null);
    setTransferPasswordHashes(false);
    setMerge(false);
    setUploadError(null);
    setUploadErrorTitle(t('migration.importModal.uploadErrorTitle.uploadFailed'));
    refreshedAppCacheForRunIdRef.current = null;
  }, [t]);

  const handleClose = () => {
    resetState();
    onClose();
  };

  useEffect(() => {
    if (!opened) resetState();
  }, [opened, resetState]);

  const canProceedFromUpload = preflight?.ok === true && !uploadError;
  const preflightFailed = preflight != null && !preflight.ok;
  const requiresMerge = preflight?.requiresMerge === true || preflight?.targetEmpty === false;
  const canProceedFromOptions = !requiresMerge || merge;
  const postImportHref = me?.user?.isAdmin ? '/company' : '/';
  const mergeStats =
    importRun?.optionsJson?.merge === true ? importRun.optionsJson.mergeStats : undefined;

  const handleFileSelect = (file: File) => {
    setUploadFile(file);
    setPreflight(null);
    setUploadError(null);
    setImportRunId(null);
  };

  const stepContent = (() => {
    if (activeStep === 0) {
      return (
        <Stack gap="sm">
          {requiresMerge ? (
            <Alert
              color="yellow"
              variant="light"
              title={t('migration.importModal.mergeRequiredTitle')}
            >
              {t('migration.importModal.mergeRequiredMessage')}
            </Alert>
          ) : (
            <Alert
              color="red"
              variant="filled"
              title={t('migration.importModal.freshInstanceTitle')}
            >
              {t('migration.importModal.freshInstanceMessage')}
            </Alert>
          )}
          {!uploadFile ? (
            <PlatformImportDropzone
              onFileSelect={handleFileSelect}
              disabled={uploadMutation.isPending}
            />
          ) : (
            <Card withBorder padding="sm" radius="md">
              <Group justify="space-between" wrap="nowrap">
                <Stack gap={2}>
                  <Text size="sm" fw={500}>
                    {uploadFile.name}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {(uploadFile.size / (1024 * 1024)).toFixed(2)} MB
                  </Text>
                </Stack>
                <Button
                  variant="subtle"
                  size="compact-sm"
                  disabled={uploadMutation.isPending || importInProgress}
                  onClick={() => {
                    setUploadFile(null);
                    setPreflight(null);
                    setUploadError(null);
                    setImportRunId(null);
                  }}
                >
                  {t('migration.importModal.remove')}
                </Button>
              </Group>
            </Card>
          )}
          {uploadMutation.isPending ? (
            <Group gap="xs">
              <Loader size="xs" />
              <Text size="sm">{t('migration.importModal.uploadingHint')}</Text>
            </Group>
          ) : null}
          {uploadError ? (
            <Alert color="red" variant="filled" title={uploadErrorTitle}>
              {uploadError}
            </Alert>
          ) : null}
          {preflightFailed ? (
            <Alert color="red" title={t('migration.importModal.preflightFailedTitle')}>
              <List size="sm" spacing="xs">
                {preflight.errors.map((error) => (
                  <List.Item key={error}>{error}</List.Item>
                ))}
              </List>
            </Alert>
          ) : null}
          {preflight?.warnings.length ? (
            <Alert
              color="red"
              variant="filled"
              title={t('migration.importModal.preflightWarningsTitle')}
            >
              <List size="sm" spacing="xs">
                {preflight.warnings.map((warning) => (
                  <List.Item key={warning}>{warning}</List.Item>
                ))}
              </List>
            </Alert>
          ) : null}
          {canProceedFromUpload ? (
            <Text size="sm" c="dimmed">
              {t('migration.importModal.preflightPassedHint')}
            </Text>
          ) : null}
        </Stack>
      );
    }

    if (activeStep === 1 && preflight?.ok) {
      return (
        <Stack gap="sm">
          <Text size="sm">
            {t('migration.importModal.sourceVersion', {
              version: preflight.sourceAppVersion ?? t('migration.importModal.unknownVersion'),
              target: preflight.targetAppVersion,
            })}
          </Text>
          <MigrationRunStatsGrid counts={preflight.counts} />
          {requiresMerge ? (
            <Checkbox
              label={t('migration.importModal.merge')}
              description={t('migration.importModal.mergeDescription')}
              checked={merge}
              onChange={(e) => setMerge(e.currentTarget.checked)}
            />
          ) : null}
          {preflight.sameAppVersion ? (
            <Checkbox
              label={t('migration.importModal.transferPasswordHashes')}
              checked={transferPasswordHashes}
              onChange={(e) => setTransferPasswordHashes(e.currentTarget.checked)}
            />
          ) : (
            <Text size="sm" c="dimmed">
              {t('migration.importModal.passwordResetRequired')}
            </Text>
          )}
        </Stack>
      );
    }

    if (activeStep === 2) {
      return (
        <Alert color="red" variant="filled">
          {merge
            ? t('migration.importModal.maintenanceWarningMerge')
            : t('migration.importModal.maintenanceWarning')}
        </Alert>
      );
    }

    if (activeStep === 3) {
      if (confirmMutation.isPending || (importRun && importInProgress)) {
        return (
          <Stack gap="md">
            <Group gap="xs">
              <Loader size="sm" />
              <Text size="sm">
                {importRun
                  ? formatPlatformImportStatus(importRun.status, t)
                  : t('migration.importModal.startingImport')}
              </Text>
            </Group>
            {importRun ? <PlatformImportPhaseList status={importRun.status} /> : null}
          </Stack>
        );
      }

      if (importRun?.status === 'succeeded') {
        return (
          <Stack gap="sm">
            <Alert color="green" variant="filled" title={t('migration.importModal.completeTitle')}>
              {t('migration.importModal.completeMessage')}
            </Alert>
            {mergeStats ? (
              <Alert
                color="blue"
                variant="light"
                title={t('migration.importModal.mergeReportTitle')}
              >
                <Text size="sm">
                  {t('migration.importModal.mergeReportReused', {
                    companies: mergeStats.reused.companies ?? 0,
                    users: mergeStats.reused.users ?? 0,
                    processes: mergeStats.reused.processes ?? 0,
                    tags: mergeStats.reused.tags ?? 0,
                  })}
                </Text>
                <Text size="sm">
                  {t('migration.importModal.mergeReportCreated', {
                    documents: mergeStats.created.documents ?? 0,
                    companies: mergeStats.created.companies ?? 0,
                    users: mergeStats.created.users ?? 0,
                  })}
                </Text>
                <Text size="sm">
                  {t('migration.importModal.mergeReportSkipped', {
                    memberships:
                      (mergeStats.skipped.teamMembers ?? 0) +
                      (mergeStats.skipped.teamLeads ?? 0) +
                      (mergeStats.skipped.departmentLeads ?? 0) +
                      (mergeStats.skipped.companyLeads ?? 0),
                    grants: mergeStats.skipped.grants ?? 0,
                    pins: mergeStats.skipped.pins ?? 0,
                  })}
                </Text>
              </Alert>
            ) : null}
          </Stack>
        );
      }

      if (importRun && isTerminalImportStatus(importRun.status)) {
        return (
          <Alert color="red" title={t('migration.importModal.failedTitle')}>
            {importRun.errorMessage ?? importRun.status}
          </Alert>
        );
      }

      return (
        <Group gap="xs">
          <Loader size="sm" />
          <Text size="sm">{t('migration.importModal.waitingForStatus')}</Text>
        </Group>
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
          primaryLabel={
            canProceedFromUpload
              ? t('migration.importModal.continue')
              : t('migration.importModal.uploadAndCheck')
          }
          onPrimary={() => {
            if (canProceedFromUpload) {
              setActiveStep(1);
            } else if (uploadFile) {
              uploadMutation.mutate(uploadFile);
            }
          }}
          primaryLoading={uploadMutation.isPending}
          primaryDisabled={!uploadFile || (preflightFailed && !canProceedFromUpload)}
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
          primaryLabel={t('migration.importModal.continue')}
          onPrimary={() => setActiveStep(2)}
          primaryDisabled={!canProceedFromOptions}
        />
      );
    }

    if (activeStep === 2) {
      return (
        <MigrationWizardFooter
          onCancel={handleClose}
          showBack
          onBack={() => setActiveStep(1)}
          showPrimary
          primaryLabel={t('migration.importModal.confirmImport')}
          primaryColor="red"
          onPrimary={() => confirmMutation.mutate()}
          primaryLoading={confirmMutation.isPending}
        />
      );
    }

    if (activeStep === 3 && importRun?.status === 'succeeded') {
      return (
        <MigrationWizardFooter
          secondaryLabel={t('migration.importModal.goToHome')}
          onSecondary={() => {
            handleClose();
            void navigate(postImportHref);
          }}
          showPrimary
          primaryLabel={t('migration.importModal.done')}
          onPrimary={handleClose}
        />
      );
    }

    if (activeStep === 3 && importRun && isTerminalImportStatus(importRun.status)) {
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
      title={t('migration.importModal.title')}
      size="xl"
      closeOnClickOutside={activeStep < 3 && !uploadMutation.isPending}
    >
      <MigrationWizardLayout activeStep={activeStep} steps={IMPORT_WIZARD_STEPS} footer={footer}>
        {stepContent}
      </MigrationWizardLayout>
    </Modal>
  );
}
