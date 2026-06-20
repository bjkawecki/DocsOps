import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Group, Loader, Modal, Stack, Stepper, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiBase, apiFetch } from '../../../api/client';
import {
  type PlatformExportRun,
  formatPlatformExportStatus,
  isInProgressPlatformExportStatus,
} from './adminMigrationTypes';
import { isTerminalExportStatus, MIGRATION_RUN_POLL_INTERVAL_MS } from './migrationRunPolling';

type Props = {
  opened: boolean;
  onClose: () => void;
};

const EXPORT_STEPS = ['Overview', 'Confirm', 'Progress', 'Done'] as const;

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
    enabled: opened && exportRunId != null,
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
    triggerDownload(exportRun.id);
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

  const triggerDownload = (id: string) => {
    const anchor = document.createElement('a');
    anchor.href = `${apiBase}/api/v1/admin/platform-exports/${id}/download`;
    anchor.click();
  };

  const handleClose = () => {
    setActiveStep(0);
    setExportRunId(null);
    autoDownloadedRef.current = null;
    onClose();
  };

  useEffect(() => {
    if (!opened) return;
    setActiveStep(0);
    setExportRunId(null);
    autoDownloadedRef.current = null;
  }, [opened]);

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Export platform"
      size="lg"
      closeOnClickOutside={activeStep < 2}
    >
      <Stack gap="md">
        <Stepper active={activeStep} size="sm">
          {EXPORT_STEPS.map((label) => (
            <Stepper.Step key={label} label={label} />
          ))}
        </Stepper>

        {activeStep === 0 && (
          <Stack gap="sm">
            <Text size="sm">
              Creates a <code>docsops-platform-export-*.tar.zst</code> archive with organization,
              users, contexts, documents, grants, tags, pins, comments, suggestions, and file
              attachments. Sessions, notifications, and backup metadata are not included.
            </Text>
            <Alert color="blue" variant="filled">
              For disaster recovery on the same server, use operational backup on the{' '}
              <Link to="/admin/backup">Backup</Link> tab instead.
            </Alert>
            <Group justify="flex-end">
              <Button variant="default" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={() => setActiveStep(1)}>Continue</Button>
            </Group>
          </Stack>
        )}

        {activeStep === 1 && (
          <Stack gap="sm">
            <Alert color="orange" variant="filled">
              The export job reads domain data from the database and MinIO. Large instances may take
              several minutes.
            </Alert>
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setActiveStep(0)}>
                Back
              </Button>
              <Button loading={exportMutation.isPending} onClick={() => exportMutation.mutate()}>
                Start export
              </Button>
            </Group>
          </Stack>
        )}

        {activeStep === 2 && (
          <Stack gap="sm" align="center">
            <Loader size="sm" />
            <Text size="sm">
              {exportRun ? formatPlatformExportStatus(exportRun.status) : 'Starting export…'}
            </Text>
          </Stack>
        )}

        {activeStep === 3 && exportRun && (
          <Stack gap="sm">
            {exportRun.status === 'succeeded' ? (
              <>
                <Alert color="green" variant="filled" title="Export complete">
                  Archive size:{' '}
                  {exportRun.sizeBytes != null
                    ? `${Math.round(exportRun.sizeBytes / 1024)} KB`
                    : 'unknown'}
                </Alert>
                <Text size="sm" c="dimmed">
                  The download should start automatically. If not, use the button below.
                </Text>
                <Group justify="flex-end">
                  <Button variant="filled" onClick={() => triggerDownload(exportRun.id)}>
                    Download again
                  </Button>
                  <Button onClick={handleClose}>Done</Button>
                </Group>
              </>
            ) : (
              <>
                <Alert color="red" title="Export failed">
                  {exportRun.errorMessage ?? 'Unknown error'}
                </Alert>
                <Group justify="flex-end">
                  <Button onClick={handleClose}>Close</Button>
                </Group>
              </>
            )}
          </Stack>
        )}
      </Stack>
    </Modal>
  );
}
