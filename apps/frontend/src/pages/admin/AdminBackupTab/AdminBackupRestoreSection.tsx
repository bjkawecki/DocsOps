import { useRef, useState } from 'react';
import { Badge, Button, Group, Loader, Stack, Table, Text } from '@mantine/core';
import { apiFetch } from '../../../api/client';
import type { RestoreRun } from './adminBackupTypes';
import { formatRestoreSource } from './restoreRunPolling';

const RESTORE_STATUS_COLOR: Record<string, string> = {
  queued: 'gray',
  running: 'blue',
  validating: 'cyan',
  restoring_db: 'indigo',
  restoring_minio: 'violet',
  succeeded: 'green',
  failed: 'red',
};

type Props = {
  restores: RestoreRun[] | undefined;
  loading: boolean;
  maintenanceActive: boolean;
  onUploadComplete: (restoreRunId: string) => void;
};

export function AdminBackupRestoreSection({
  restores,
  loading,
  maintenanceActive,
  onUploadComplete,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const items = restores ?? [];

  const handleFileChange = async (file: File | null) => {
    if (!file) return;
    setUploadError(null);
    setUploadLoading(true);
    if (!file.name.endsWith('.tar.zst')) {
      setUploadError('Select a docsops-backup-*.tar.zst archive.');
      setUploadLoading(false);
      return;
    }
    try {
      const res = await apiFetch('/api/v1/admin/restores/upload', {
        method: 'POST',
        body: (() => {
          const form = new FormData();
          form.append('file', file, file.name);
          return form;
        })(),
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
    <Stack gap="sm">
      <Group justify="space-between" align="flex-end">
        <div>
          <Text fw={600} size="sm">
            Restore from file
          </Text>
          <Text size="xs" c="dimmed">
            Upload an operational backup archive copied from external storage
            (docsops-backup-*.tar.zst). See Runbook-Backup-Restore in the project docs for manual
            steps.
          </Text>
        </div>
        <Group gap="xs">
          <input
            ref={fileInputRef}
            type="file"
            accept=".tar.zst,application/zstd"
            hidden
            onChange={(e) => void handleFileChange(e.target.files?.[0] ?? null)}
          />
          <Button
            size="xs"
            variant="filled"
            loading={uploadLoading}
            disabled={maintenanceActive}
            onClick={() => fileInputRef.current?.click()}
          >
            Upload archive
          </Button>
        </Group>
      </Group>
      {uploadError ? (
        <Text size="sm" c="red">
          {uploadError}
        </Text>
      ) : null}

      <Text size="sm" c="dimmed">
        {items.length} restore(s)
      </Text>
      {loading ? (
        <Loader size="sm" />
      ) : (
        <Table withTableBorder withColumnBorders className="admin-table-hover">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Started</Table.Th>
              <Table.Th>Finished</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Source</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {items.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={4}>
                  <Text size="sm" c="dimmed">
                    No restores yet.
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              items.map((run) => (
                <Table.Tr key={run.id}>
                  <Table.Td>
                    <Text size="sm">{new Date(run.createdAt).toLocaleString()}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">
                      {run.finishedAt ? new Date(run.finishedAt).toLocaleString() : '–'}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Stack gap={4}>
                      <Badge color={RESTORE_STATUS_COLOR[run.status] ?? 'gray'} variant="filled">
                        {run.status}
                      </Badge>
                      {run.status === 'failed' && run.errorMessage ? (
                        <Text size="xs" c="dimmed" style={{ wordBreak: 'break-word' }}>
                          {run.errorMessage}
                        </Text>
                      ) : null}
                    </Stack>
                  </Table.Td>
                  <Table.Td>{formatRestoreSource(run)}</Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      )}
    </Stack>
  );
}
