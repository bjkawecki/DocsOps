import { useEffect, useRef, useState } from 'react';
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
};

const IMPORT_WIZARD_STEPS = [
  { label: 'Upload & check', description: 'Archive preflight' },
  { label: 'Options', description: 'Import settings' },
  { label: 'Confirm', description: 'Maintenance warning' },
  { label: 'Result', description: 'Progress & outcome' },
] as const;

function uploadErrorTitleFromMessage(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('http 5') || lower.includes('server error')) {
    return 'Server error during upload';
  }
  if (lower.includes('too large')) return 'Upload too large';
  if (lower.includes('unpack') || lower.includes('.tar.zst')) return 'Invalid export archive';
  if (lower.includes('minio')) return 'Storage unavailable';
  return 'Upload failed';
}

export function AdminMigrationImportModal({ opened, onClose }: Props) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: me } = useMe();
  const [activeStep, setActiveStep] = useState(0);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [importRunId, setImportRunId] = useState<string | null>(null);
  const [preflight, setPreflight] = useState<PlatformImportPreflight | null>(null);
  const [transferPasswordHashes, setTransferPasswordHashes] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadErrorTitle, setUploadErrorTitle] = useState('Upload failed');
  const refreshedAppCacheForRunIdRef = useRef<string | null>(null);

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
      setUploadErrorTitle('Upload failed');
      setImportRunId(data.platformImportRunId);
      setPreflight(data.preflight);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'platform-migration', 'status'] });
    },
    onError: (err: Error) => {
      setUploadErrorTitle(uploadErrorTitleFromMessage(err.message));
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
        body: JSON.stringify({ transferPasswordHashes }),
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
      notifications.show({ title: 'Import failed', message: err.message, color: 'red' });
    },
  });

  const resetState = () => {
    setActiveStep(0);
    setUploadFile(null);
    setImportRunId(null);
    setPreflight(null);
    setTransferPasswordHashes(false);
    setUploadError(null);
    setUploadErrorTitle('Upload failed');
    refreshedAppCacheForRunIdRef.current = null;
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  useEffect(() => {
    if (!opened) resetState();
  }, [opened]);

  const canProceedFromUpload = preflight?.ok === true && !uploadError;
  const preflightFailed = preflight != null && !preflight.ok;
  const postImportHref = me?.user?.isAdmin ? '/company' : '/';

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
          <Alert color="red" variant="filled" title="Fresh empty instance required">
            Import is only supported on a freshly installed empty instance (no companies or
            documents). Failed imports on an empty target should roll back automatically.
          </Alert>
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
                  Remove
                </Button>
              </Group>
            </Card>
          )}
          {uploadMutation.isPending ? (
            <Group gap="xs">
              <Loader size="xs" />
              <Text size="sm">Uploading and running preflight…</Text>
            </Group>
          ) : null}
          {uploadError ? (
            <Alert color="red" variant="filled" title={uploadErrorTitle}>
              {uploadError}
            </Alert>
          ) : null}
          {preflightFailed ? (
            <Alert color="red" title="Preflight failed">
              <List size="sm" spacing="xs">
                {preflight.errors.map((error) => (
                  <List.Item key={error}>{error}</List.Item>
                ))}
              </List>
            </Alert>
          ) : null}
          {preflight?.warnings.length ? (
            <Alert color="red" variant="filled" title="Preflight warnings">
              <List size="sm" spacing="xs">
                {preflight.warnings.map((warning) => (
                  <List.Item key={warning}>{warning}</List.Item>
                ))}
              </List>
            </Alert>
          ) : null}
          {canProceedFromUpload ? (
            <Text size="sm" c="dimmed">
              Preflight passed. Continue to options.
            </Text>
          ) : null}
        </Stack>
      );
    }

    if (activeStep === 1 && preflight?.ok) {
      return (
        <Stack gap="sm">
          <Text size="sm">
            Source version: {preflight.sourceAppVersion ?? 'unknown'} · Target:{' '}
            {preflight.targetAppVersion}
          </Text>
          <MigrationRunStatsGrid counts={preflight.counts} />
          {preflight.sameAppVersion ? (
            <Checkbox
              label="Transfer password hashes (same APP_VERSION only)"
              checked={transferPasswordHashes}
              onChange={(e) => setTransferPasswordHashes(e.currentTarget.checked)}
            />
          ) : (
            <Text size="sm" c="dimmed">
              Imported users will need to reset their passwords (different app version).
            </Text>
          )}
        </Stack>
      );
    }

    if (activeStep === 2) {
      return (
        <Alert color="red" variant="filled">
          Import activates maintenance mode and writes all domain data. The target instance must be
          empty.
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
                {importRun ? formatPlatformImportStatus(importRun.status) : 'Starting import…'}
              </Text>
            </Group>
            {importRun ? <PlatformImportPhaseList status={importRun.status} /> : null}
          </Stack>
        );
      }

      if (importRun?.status === 'succeeded') {
        return (
          <Alert color="green" variant="filled" title="Import complete">
            Platform data has been imported. The sidebar and lists will refresh automatically.
            Search reindex may still be running.
          </Alert>
        );
      }

      if (importRun && isTerminalImportStatus(importRun.status)) {
        return (
          <Alert color="red" title="Import failed">
            {importRun.errorMessage ?? importRun.status}
          </Alert>
        );
      }

      return (
        <Group gap="xs">
          <Loader size="sm" />
          <Text size="sm">Waiting for import status…</Text>
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
          primaryLabel={canProceedFromUpload ? 'Continue' : 'Upload and check'}
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
          primaryLabel="Continue"
          onPrimary={() => setActiveStep(2)}
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
          primaryLabel="Confirm import"
          primaryColor="red"
          onPrimary={() => confirmMutation.mutate()}
          primaryLoading={confirmMutation.isPending}
        />
      );
    }

    if (activeStep === 3 && importRun?.status === 'succeeded') {
      return (
        <MigrationWizardFooter
          secondaryLabel="Go to home"
          onSecondary={() => {
            handleClose();
            void navigate(postImportHref);
          }}
          showPrimary
          primaryLabel="Done"
          onPrimary={handleClose}
        />
      );
    }

    if (activeStep === 3 && importRun && isTerminalImportStatus(importRun.status)) {
      return <MigrationWizardFooter onCancel={handleClose} cancelLabel="Close" />;
    }

    return null;
  })();

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Import platform export"
      size="xl"
      closeOnClickOutside={activeStep < 3 && !uploadMutation.isPending}
    >
      <MigrationWizardLayout
        activeStep={activeStep}
        steps={[...IMPORT_WIZARD_STEPS]}
        footer={footer}
      >
        {stepContent}
      </MigrationWizardLayout>
    </Modal>
  );
}
