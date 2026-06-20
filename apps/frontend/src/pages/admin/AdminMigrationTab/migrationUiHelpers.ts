import { apiBase } from '../../../api/client';
import type { PlatformMigrationStatus } from './adminMigrationTypes';

export function triggerPlatformExportDownload(exportRunId: string): void {
  const anchor = document.createElement('a');
  anchor.href = `${apiBase}/api/v1/admin/platform-exports/${exportRunId}/download`;
  anchor.click();
}

export function getExportDisabledReason(
  status: PlatformMigrationStatus | undefined,
  isLoading: boolean
): string | null {
  if (isLoading) return 'Loading migration status…';
  if (!status?.minioAvailable) return 'MinIO is unavailable';
  if (!status?.workerConnected) return 'Job worker is disconnected';
  if (status.activeExportRun) return 'An export is already in progress';
  return null;
}

export function getImportDisabledReason(
  status: PlatformMigrationStatus | undefined,
  isLoading: boolean
): string | null {
  if (isLoading) return 'Loading migration status…';
  if (status && !status.instanceEmpty) {
    return 'Import is only available on a freshly installed empty instance (no companies or documents).';
  }
  if (!status?.minioAvailable) return 'MinIO is unavailable';
  if (!status?.workerConnected) return 'Job worker is disconnected';
  if (status?.activeImportRun) return 'An import is already in progress';
  if (status?.maintenanceReason === 'platform-import') {
    return 'Maintenance mode active (platform import)';
  }
  return null;
}
