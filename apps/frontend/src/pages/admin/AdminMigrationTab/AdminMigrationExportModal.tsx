import { useEffect, useRef, useState } from 'react';
import { Alert, Loader, Modal, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../../api/client';
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

const EXPORT_WIZARD_STEPS = [
  { label: 'Overview', description: 'What is exported' },
  { label: 'Confirm', description: 'Start export job' },
  { label: 'Progress', description: 'Job status' },
  { label: 'Done', description: 'Download archive' },
] as const;

export function AdminMigrationExportModal({ opened, onClose }: Props) {
  const queryClient = useQueryClient();
  const [activeStep, setActiveStep] = useState(0);
  const [exportRunId, setExportRunId] = useState<string | null>(null);
  const autoDownloadedRef = useRef<string | null>(null);

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
      notifications.show({ title: 'Export failed', message: err.message, color: 'red' });
    },
  });

  const handleClose = () => {
    setActiveStep(0);
    setExportRunId(null);
    autoDownloadedRef.current = null;
    onClose();
  };

  useEffect(() => {
    if (!opened) {
      setActiveStep(0);
      setExportRunId(null);
      autoDownloadedRef.current = null;
    }
  }, [opened]);

  const stepContent = (() => {
    if (activeStep === 0) {
      return (
        <Stack gap="sm">
          <Text size="sm">
            Creates a <code>docsops-platform-export-*.tar.zst</code> archive with organization,
            users, contexts, documents, grants, tags, pins, comments, and file attachments.
            Sessions, notifications, and backup metadata are not included.
          </Text>
          <Alert color="red" variant="filled" title="Not disaster recovery">
            For disaster recovery on the same server, use operational backup on the{' '}
            <Link to="/admin/backup">Backup</Link> tab instead.
          </Alert>
        </Stack>
      );
    }

    if (activeStep === 1) {
      return (
        <Alert color="blue" variant="light">
          The export job reads domain data from the database and MinIO. Large instances may take
          several minutes.
        </Alert>
      );
    }

    if (activeStep === 2) {
      return (
        <Stack gap="sm" align="center">
          <Loader size="sm" />
          <Text size="sm">
            {exportRun ? formatPlatformExportStatus(exportRun.status) : 'Starting export…'}
          </Text>
          {exportRun?.status === 'packaging' ? (
            <Text size="xs" c="dimmed">
              Packaging archive for download…
            </Text>
          ) : null}
        </Stack>
      );
    }

    if (activeStep === 3 && exportRun) {
      if (exportRun.status === 'succeeded') {
        return (
          <Stack gap="sm">
            <Alert color="green" variant="filled" title="Export complete">
              Archive size: {formatBytes(exportRun.sizeBytes)}
            </Alert>
            <Text size="sm" c="dimmed">
              The download should start automatically. If not, use Download again below.
            </Text>
          </Stack>
        );
      }

      return (
        <Alert color="red" title="Export failed">
          {exportRun.errorMessage ?? 'Unknown error'}
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
          primaryLabel="Continue"
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
          primaryLabel="Start export"
          onPrimary={() => exportMutation.mutate()}
          primaryLoading={exportMutation.isPending}
        />
      );
    }

    if (activeStep === 3 && exportRun?.status === 'succeeded') {
      return (
        <MigrationWizardFooter
          secondaryLabel="Download again"
          onSecondary={() => triggerPlatformExportDownload(exportRun.id)}
          showPrimary
          primaryLabel="Done"
          onPrimary={handleClose}
        />
      );
    }

    if (activeStep === 3 && exportRun?.status === 'failed') {
      return <MigrationWizardFooter onCancel={handleClose} cancelLabel="Close" />;
    }

    return null;
  })();

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Export platform"
      size="xl"
      closeOnClickOutside={activeStep < 2}
    >
      <MigrationWizardLayout
        activeStep={activeStep}
        steps={[...EXPORT_WIZARD_STEPS]}
        footer={footer}
      >
        {stepContent}
      </MigrationWizardLayout>
    </Modal>
  );
}
