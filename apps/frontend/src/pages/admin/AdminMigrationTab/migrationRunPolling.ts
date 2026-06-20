import type { PlatformExportRun, PlatformImportRun } from './adminMigrationTypes';
import {
  isInProgressPlatformExportStatus,
  isInProgressPlatformImportStatus,
} from './adminMigrationTypes';

export const MIGRATION_RUN_POLL_INTERVAL_MS = 2000;

export function hasActiveMigrationRun(status: {
  activeExportRun: PlatformExportRun | null;
  activeImportRun: PlatformImportRun | null;
  maintenanceReason?: string | null;
}): boolean {
  return Boolean(
    status.activeExportRun ||
    status.activeImportRun ||
    status.maintenanceReason === 'platform-import'
  );
}

export function getMigrationStatusRefetchIntervalMs(args: {
  status:
    | {
        activeExportRun: PlatformExportRun | null;
        activeImportRun: PlatformImportRun | null;
        maintenanceReason?: string | null;
      }
    | undefined;
  isTabVisible: boolean;
}): number | false {
  const { status, isTabVisible } = args;
  if (!isTabVisible) return false;
  if (!status) return false;
  if (hasActiveMigrationRun(status)) return MIGRATION_RUN_POLL_INTERVAL_MS;
  return false;
}

export function isTerminalExportStatus(status: string): boolean {
  return status === 'succeeded' || status === 'failed';
}

export function isTerminalImportStatus(status: string): boolean {
  return status === 'succeeded' || status === 'failed' || status === 'preflight_failed';
}

export function isInProgressExportRun(run: PlatformExportRun | null | undefined): boolean {
  return run != null && isInProgressPlatformExportStatus(run.status);
}

export function isInProgressImportRun(run: PlatformImportRun | null | undefined): boolean {
  return run != null && isInProgressPlatformImportStatus(run.status);
}
