import { Group, Text } from '@mantine/core';
import {
  formatBytes,
  formatPlatformRunStatus,
  type PlatformMigrationStatus,
} from './adminMigrationTypes';
import { MigrationInfrastructureBadges } from './MigrationInfrastructureBadges';
import { PlatformInstanceCountsTable } from './PlatformInstanceCountsTable';
import { triggerPlatformExportDownload } from './migrationUiHelpers';

type Props = {
  status: PlatformMigrationStatus;
};

function ExportArchiveCommandHint({ status }: { status: PlatformMigrationStatus }) {
  const { lastExportRun, activeExportRun } = status;
  const canDownload = lastExportRun?.status === 'succeeded' && lastExportRun.localObjectKey != null;

  if (activeExportRun) {
    return (
      <Group gap={6} wrap="wrap" align="center">
        <Text size="sm" c="dimmed">
          Export in progress…
        </Text>
        {canDownload && lastExportRun ? (
          <Text
            component="button"
            type="button"
            size="sm"
            c="dimmed"
            td="underline"
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
            }}
            onClick={() => triggerPlatformExportDownload(lastExportRun.id)}
          >
            Download previous archive
          </Text>
        ) : null}
      </Group>
    );
  }

  if (canDownload && lastExportRun) {
    const sizeLabel = lastExportRun.sizeBytes != null ? formatBytes(lastExportRun.sizeBytes) : null;
    return (
      <Group gap={6} wrap="wrap" align="center">
        {sizeLabel ? (
          <Text size="sm" c="dimmed">
            {sizeLabel}
          </Text>
        ) : null}
        <Text
          component="button"
          type="button"
          size="sm"
          c="dimmed"
          td="underline"
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
          }}
          onClick={() => triggerPlatformExportDownload(lastExportRun.id)}
        >
          Download export archive
        </Text>
      </Group>
    );
  }

  if (lastExportRun && lastExportRun.status !== 'succeeded') {
    return (
      <Text size="sm" c="dimmed">
        Last export {formatPlatformRunStatus(lastExportRun.status, 'export').toLowerCase()}.
      </Text>
    );
  }

  return (
    <Text size="sm" c="dimmed">
      No export archive yet.
    </Text>
  );
}

export function AdminMigrationOverview({ status }: Props) {
  return (
    <>
      <Group mb="md" justify="flex-start" wrap="wrap" gap="md" align="center">
        <MigrationInfrastructureBadges
          minioAvailable={status.minioAvailable}
          workerConnected={status.workerConnected}
        />
        <ExportArchiveCommandHint status={status} />
      </Group>

      <PlatformInstanceCountsTable
        instanceEmpty={status.instanceEmpty}
        counts={status.instanceCounts}
      />
    </>
  );
}
