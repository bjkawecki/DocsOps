import { Alert, Badge, Button, Card, Group, Stack, Text, Title } from '@mantine/core';
import { Link } from 'react-router-dom';
import {
  type PlatformMigrationStatus,
  formatBytes,
  formatPlatformExportStatus,
  formatPlatformImportStatus,
  isFailedPlatformImportStatus,
} from './adminMigrationTypes';

type Props = {
  status: PlatformMigrationStatus;
  onExport: () => void;
  onImport: () => void;
  exportDisabled: boolean;
  importDisabled: boolean;
};

function exportStatusColor(status: string): string {
  if (status === 'succeeded') return 'green';
  if (status === 'failed') return 'red';
  return 'blue';
}

export function AdminMigrationOverview({
  status,
  onExport,
  onImport,
  exportDisabled,
  importDisabled,
}: Props) {
  const lastExport = status.lastExportRun;
  const activeExport = status.activeExportRun;
  const activeImport = status.activeImportRun;
  const lastImport = status.lastImportRun;
  const manifest = lastExport?.manifestJson;
  const counts = manifest?.counts;

  const lastImportFailed = lastImport != null && isFailedPlatformImportStatus(lastImport.status);

  return (
    <Stack gap="md">
      <Card withBorder padding="md" radius="md">
        <Stack gap="sm">
          <Group justify="space-between" align="center">
            <Title order={4}>Export</Title>
            <Button onClick={onExport} disabled={exportDisabled}>
              Export platform
            </Button>
          </Group>
          <Group gap="xs" wrap="wrap">
            <Badge color={status.minioAvailable ? 'green' : 'red'} variant="filled">
              MinIO {status.minioAvailable ? 'OK' : 'unavailable'}
            </Badge>
            <Badge color={status.workerConnected ? 'green' : 'yellow'} variant="filled">
              Worker {status.workerConnected ? 'OK' : 'disconnected'}
            </Badge>
          </Group>
          {activeExport ? (
            <Text size="sm" c="blue">
              Export in progress: {formatPlatformExportStatus(activeExport.status)}…
            </Text>
          ) : lastExport ? (
            <Stack gap={4}>
              <Group gap="xs">
                <Badge color={exportStatusColor(lastExport.status)}>{lastExport.status}</Badge>
                <Text size="sm" c="dimmed">
                  {new Date(lastExport.createdAt).toLocaleString()}
                </Text>
              </Group>
              <Text size="sm">
                Size: {formatBytes(lastExport.sizeBytes)}
                {manifest?.sourceAppVersion ? ` · Version ${manifest.sourceAppVersion}` : ''}
              </Text>
              {counts ? (
                <Text size="sm" c="dimmed">
                  Users: {counts.users ?? 0} · Documents: {counts.documents ?? 0} · Files:{' '}
                  {counts.attachmentFiles ?? 0}
                </Text>
              ) : null}
              {lastExport.errorMessage ? (
                <Text size="sm" c="red">
                  {lastExport.errorMessage}
                </Text>
              ) : null}
            </Stack>
          ) : (
            <Text size="sm" c="dimmed">
              No platform export yet.
            </Text>
          )}
        </Stack>
      </Card>

      <Card withBorder padding="md" radius="md">
        <Stack gap="sm">
          <Group justify="space-between" align="center">
            <Title order={4}>Import</Title>
            <Button onClick={onImport} disabled={importDisabled}>
              Import platform
            </Button>
          </Group>
          <Text size="sm" c="dimmed">
            Upload a platform export archive on an empty instance. For disaster recovery, use{' '}
            <Link to="/admin/backup">Backup</Link>.
          </Text>
          {activeImport ? (
            <Text size="sm" c="blue">
              Import in progress: {formatPlatformImportStatus(activeImport.status)}…
            </Text>
          ) : null}
          {lastImportFailed && lastImport ? (
            <Alert color="red" variant="filled" title="Last import did not succeed">
              <Text size="sm">
                {new Date(lastImport.createdAt).toLocaleString()} — {lastImport.status}
              </Text>
              {lastImport.errorMessage ? (
                <Text size="sm" mt={4}>
                  {lastImport.errorMessage}
                </Text>
              ) : null}
            </Alert>
          ) : null}
        </Stack>
      </Card>
    </Stack>
  );
}
