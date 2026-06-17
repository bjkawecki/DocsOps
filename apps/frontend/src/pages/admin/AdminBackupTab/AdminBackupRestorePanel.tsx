import { useRef, useState } from 'react';
import {
  Alert,
  Button,
  Group,
  Modal,
  Radio,
  SegmentedControl,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import { apiFetch } from '../../../api/client';
import type { BackupRun } from './adminBackupTypes';
import { formatBackupRunLabel, listRestorableBackups } from './backupRestoreHelpers';

type RestoreSource = 'history' | 'upload';

type Props = {
  backups: BackupRun[] | undefined;
  maintenanceActive: boolean;
  restoreFromBackupLoading: boolean;
  onRestoreFromBackup: (backupRunId: string) => void;
  onUploadComplete: (restoreRunId: string) => void;
};

export function AdminBackupRestorePanel({
  backups,
  maintenanceActive,
  restoreFromBackupLoading,
  onRestoreFromBackup,
  onUploadComplete,
}: Props) {
  const [source, setSource] = useState<RestoreSource>('history');
  const [selectedBackupId, setSelectedBackupId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const restorableBackups = listRestorableBackups(backups);
  const selectedBackup = restorableBackups.find((b) => b.id === selectedBackupId) ?? null;

  const handleHistoryStart = () => {
    if (!selectedBackupId) return;
    setConfirmOpen(true);
  };

  const handleConfirmRestore = () => {
    if (!selectedBackupId) return;
    onRestoreFromBackup(selectedBackupId);
    setConfirmOpen(false);
  };

  const handleFileChange = async (file: File | null) => {
    if (!file) return;
    setUploadError(null);
    if (!file.name.endsWith('.tar.zst')) {
      setUploadError('Select a docsops-backup-*.tar.zst archive.');
      return;
    }
    setUploadLoading(true);
    try {
      const form = new FormData();
      form.append('file', file, file.name);
      const res = await apiFetch('/api/v1/admin/restores/upload', {
        method: 'POST',
        body: form,
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? 'Upload failed');
      }
      const result = (await res.json()) as { restoreRunId: string };
      onUploadComplete(result.restoreRunId);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploadLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <Stack gap="md">
        <Alert color="red" title="Destructive operation" variant="filled">
          This replaces the entire database and MinIO objects. All users must sign in again after
          restore completes. Secrets from <code>.env</code> are not in the archive.
        </Alert>

        <SegmentedControl
          value={source}
          onChange={(v) => setSource(v as RestoreSource)}
          data={[
            { label: 'From backup history', value: 'history' },
            { label: 'Upload archive', value: 'upload' },
          ]}
        />

        {source === 'history' ? (
          <Stack gap="sm">
            {restorableBackups.length === 0 ? (
              <Text size="sm" c="dimmed">
                No backups with a local copy available. Upload an archive instead or restore from
                external storage manually (see Runbook-Backup-Restore).
              </Text>
            ) : (
              <Radio.Group
                value={selectedBackupId}
                onChange={setSelectedBackupId}
                label="Select backup"
              >
                <Stack gap="xs" mt="xs">
                  {restorableBackups.map((run) => (
                    <Radio key={run.id} value={run.id} label={formatBackupRunLabel(run)} />
                  ))}
                </Stack>
              </Radio.Group>
            )}
            <Group justify="flex-end">
              <Tooltip
                label={maintenanceActive ? 'Maintenance mode is active' : undefined}
                disabled={!maintenanceActive}
              >
                <Button
                  color="red"
                  disabled={!selectedBackupId || maintenanceActive}
                  loading={restoreFromBackupLoading}
                  onClick={handleHistoryStart}
                >
                  Start restore
                </Button>
              </Tooltip>
            </Group>
          </Stack>
        ) : (
          <Stack gap="sm">
            <Text size="xs" c="dimmed">
              Upload docsops-backup-*.tar.zst copied from external storage.
            </Text>
            <input
              ref={fileInputRef}
              type="file"
              accept=".tar.zst,application/zstd"
              hidden
              onChange={(e) => void handleFileChange(e.target.files?.[0] ?? null)}
            />
            {uploadError ? (
              <Text size="sm" c="red">
                {uploadError}
              </Text>
            ) : null}
            <Group justify="flex-end">
              <Button
                color="red"
                loading={uploadLoading}
                disabled={maintenanceActive}
                onClick={() => fileInputRef.current?.click()}
              >
                Select archive and start restore
              </Button>
            </Group>
          </Stack>
        )}
      </Stack>

      <Modal
        opened={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Start restore?"
        centered
        size="sm"
      >
        <Stack gap="md">
          <Text size="sm">
            This will replace the <strong>entire database</strong> and MinIO objects with{' '}
            <strong>
              {selectedBackup
                ? `backup from ${new Date(selectedBackup.createdAt).toLocaleString()}`
                : 'the selected backup'}
            </strong>
            . Existing data will be overwritten.
          </Text>
          <Text size="sm" c="dimmed">
            Write operations are blocked while restore runs.
          </Text>
          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={() => setConfirmOpen(false)}
              disabled={restoreFromBackupLoading}
            >
              Cancel
            </Button>
            <Button color="red" loading={restoreFromBackupLoading} onClick={handleConfirmRestore}>
              Start restore
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
