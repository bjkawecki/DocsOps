import { apiBase } from '../../../api/client';
import type { PlatformMigrationStatus } from './adminMigrationTypes';

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

export function triggerPlatformExportDownload(exportRunId: string): void {
  const anchor = document.createElement('a');
  anchor.href = `${apiBase}/api/v1/admin/platform-exports/${exportRunId}/download`;
  anchor.click();
}

export function getExportDisabledReason(
  status: PlatformMigrationStatus | undefined,
  isLoading: boolean,
  t: TranslateFn
): string | null {
  if (isLoading) return t('migration.disabledReason.loading');
  if (!status?.minioAvailable) return t('migration.disabledReason.minioUnavailable');
  if (!status?.workerConnected) return t('migration.disabledReason.workerDisconnected');
  if (status.activeExportRun) return t('migration.disabledReason.exportInProgress');
  return null;
}

export function getImportDisabledReason(
  status: PlatformMigrationStatus | undefined,
  isLoading: boolean,
  t: TranslateFn
): string | null {
  if (isLoading) return t('migration.disabledReason.loading');
  if (status && !status.instanceEmpty) {
    return t('migration.disabledReason.instanceNotEmpty');
  }
  if (!status?.minioAvailable) return t('migration.disabledReason.minioUnavailable');
  if (!status?.workerConnected) return t('migration.disabledReason.workerDisconnected');
  if (status?.activeImportRun) return t('migration.disabledReason.importInProgress');
  if (status?.maintenanceReason === 'platform-import') {
    return t('migration.disabledReason.maintenanceActive');
  }
  return null;
}
