import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Checkbox,
  FileButton,
  Group,
  List,
  Loader,
  Modal,
  Stack,
  Stepper,
  Text,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../../api/client';
import {
  type PlatformImportPreflight,
  type PlatformImportRun,
  formatPlatformImportStatus,
} from './adminMigrationTypes';
import { isTerminalImportStatus, MIGRATION_RUN_POLL_INTERVAL_MS } from './migrationRunPolling';

type Props = {
  opened: boolean;
  onClose: () => void;
};

const IMPORT_STEPS = ['Upload', 'Preflight', 'Options', 'Confirm', 'Progress', 'Done'] as const;

export function AdminMigrationImportModal({ opened, onClose }: Props) {
  const queryClient = useQueryClient();
  const [activeStep, setActiveStep] = useState(0);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [importRunId, setImportRunId] = useState<string | null>(null);
  const [preflight, setPreflight] = useState<PlatformImportPreflight | null>(null);
  const [transferPasswordHashes, setTransferPasswordHashes] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const importRunQuery = useQuery({
    queryKey: ['admin', 'platform-imports', importRunId],
    queryFn: async () => {
      if (!importRunId) throw new Error('No import run');
      const res = await apiFetch(`/api/v1/admin/platform-imports/${importRunId}`);
      if (!res.ok) throw new Error('Failed to load import status');
      return res.json() as Promise<PlatformImportRun>;
    },
    enabled: opened && importRunId != null && activeStep >= 4,
    refetchInterval: (query) => {
      const run = query.state.data;
      if (!run || isTerminalImportStatus(run.status)) return false;
      return MIGRATION_RUN_POLL_INTERVAL_MS;
    },
  });

  const importRun = importRunQuery.data;

  useEffect(() => {
    if (!importRun || activeStep < 4) return;
    if (importRun.status === 'succeeded' || importRun.status === 'failed') {
      setActiveStep(5);
    }
  }, [importRun, activeStep]);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append('file', file);
      const res = await apiFetch('/api/v1/admin/platform-imports/upload', {
        method: 'POST',
        body: form,
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? 'Upload failed');
      }
      return res.json() as Promise<{
        platformImportRunId: string;
        preflight: PlatformImportPreflight;
        status: string;
      }>;
    },
    onSuccess: (data) => {
      setUploadError(null);
      setImportRunId(data.platformImportRunId);
      setPreflight(data.preflight);
      setActiveStep(1);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'platform-migration', 'status'] });
    },
    onError: (err: Error) => {
      setUploadError(err.message);
      setActiveStep(1);
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
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? 'Failed to confirm import');
      }
      return res.json() as Promise<{ platformImportRunId: string; jobId: string }>;
    },
    onSuccess: () => {
      setActiveStep(4);
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
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  useEffect(() => {
    if (!opened) resetState();
  }, [opened]);

  const canProceedFromPreflight = preflight?.ok === true && !uploadError;
  const preflightFailed = preflight != null && !preflight.ok;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Import platform export"
      size="lg"
      closeOnClickOutside={activeStep < 4}
    >
      <Stack gap="md">
        <Stepper active={activeStep} size="sm">
          {IMPORT_STEPS.map((label) => (
            <Stepper.Step key={label} label={label} />
          ))}
        </Stepper>

        {activeStep === 0 && (
          <Stack gap="sm">
            <Text size="sm">
              Upload a <code>docsops-platform-export-*.tar.zst</code> archive. Import requires an
              empty instance (no companies or documents).
            </Text>
            <FileButton onChange={setUploadFile} accept=".tar.zst">
              {(props) => (
                <Button {...props} variant="light">
                  Select archive
                </Button>
              )}
            </FileButton>
            {uploadFile ? <Text size="sm">{uploadFile.name}</Text> : null}
            <Group justify="flex-end">
              <Button variant="default" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                disabled={!uploadFile}
                loading={uploadMutation.isPending}
                onClick={() => uploadFile && uploadMutation.mutate(uploadFile)}
              >
                Upload and run preflight
              </Button>
            </Group>
          </Stack>
        )}

        {activeStep === 1 && (
          <Stack gap="sm">
            {uploadMutation.isPending ? (
              <Group gap="xs">
                <Loader size="xs" />
                <Text size="sm">Uploading and running preflight…</Text>
              </Group>
            ) : null}
            {uploadError ? (
              <Alert color="red" title="Upload or preflight request failed">
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
            {preflight?.warnings.map((warning) => (
              <Alert key={warning} color="yellow" variant="light">
                {warning}
              </Alert>
            ))}
            {canProceedFromPreflight ? (
              <Text size="sm" c="dimmed">
                Preflight passed. Continue to options.
              </Text>
            ) : null}
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setActiveStep(0)}>
                Back
              </Button>
              <Button disabled={!canProceedFromPreflight} onClick={() => setActiveStep(2)}>
                Continue
              </Button>
            </Group>
          </Stack>
        )}

        {activeStep === 2 && preflight?.ok && (
          <Stack gap="sm">
            <Text size="sm">
              Source version: {preflight.sourceAppVersion ?? 'unknown'} · Target:{' '}
              {preflight.targetAppVersion}
            </Text>
            <Text size="sm">
              Users: {preflight.counts?.users ?? 0} · Documents: {preflight.counts?.documents ?? 0}{' '}
              · Files: {preflight.counts?.attachmentFiles ?? 0}
            </Text>
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
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setActiveStep(1)}>
                Back
              </Button>
              <Button onClick={() => setActiveStep(3)}>Continue</Button>
            </Group>
          </Stack>
        )}

        {activeStep === 3 && (
          <Stack gap="sm">
            <Alert color="orange" variant="light">
              Import activates maintenance mode and writes all domain data. The target instance must
              be empty.
            </Alert>
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setActiveStep(2)}>
                Back
              </Button>
              <Button
                color="red"
                loading={confirmMutation.isPending}
                onClick={() => confirmMutation.mutate()}
              >
                Confirm import
              </Button>
            </Group>
          </Stack>
        )}

        {activeStep === 4 && (
          <Stack gap="sm" align="center">
            <Loader size="sm" />
            <Text size="sm">
              {importRun ? formatPlatformImportStatus(importRun.status) : 'Starting import…'}
            </Text>
          </Stack>
        )}

        {activeStep === 5 && importRun && (
          <Stack gap="sm">
            {importRun.status === 'succeeded' ? (
              <>
                <Alert color="green" variant="light" title="Import complete">
                  Platform data has been imported. Search reindex may still be running.
                </Alert>
                <Group justify="flex-end">
                  <Button onClick={handleClose}>Done</Button>
                </Group>
              </>
            ) : (
              <>
                <Alert color="red" title="Import failed">
                  {importRun.errorMessage ?? importRun.status}
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
