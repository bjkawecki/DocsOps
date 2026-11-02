import { Group, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('admin');
  const { lastExportRun, activeExportRun } = status;
  const canDownload = lastExportRun?.status === 'succeeded' && lastExportRun.localObjectKey != null;

  if (activeExportRun) {
    return (
      <Group gap={6} wrap="wrap" align="center">
        <Text size="sm" c="dimmed">
          {t('migration.overview.exportInProgress')}
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
            {t('migration.overview.downloadPreviousArchive')}
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
          {t('migration.overview.downloadExportArchive')}
        </Text>
      </Group>
    );
  }

  if (lastExportRun && lastExportRun.status !== 'succeeded') {
    return (
      <Text size="sm" c="dimmed">
        {t('migration.overview.lastExportStatus', {
          status: formatPlatformRunStatus(lastExportRun.status, 'export', t),
        })}
      </Text>
    );
  }

  return (
    <Text size="sm" c="dimmed">
      {t('migration.overview.noExportArchiveYet')}
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
