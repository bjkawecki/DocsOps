import type { MaintenanceStatus } from '../../hooks/useMaintenanceStatus';
import { useElapsedMs, useElapsedSince } from '../../hooks/useElapsedSince';
import { AppShellStatusBannerBar } from './AppShellStatusBannerBar.js';

type Props = {
  status: MaintenanceStatus | undefined;
  /** Hide when the dedicated update banner is shown (avoids duplicate messages). */
  hidden?: boolean;
};

const TEN_MINUTES_MS = 10 * 60 * 1000;

function bannerMessage(status: MaintenanceStatus): string {
  if (status.reason === 'restore') {
    return 'Disaster recovery restore in progress – write operations are temporarily blocked. You may need to sign in again when complete.';
  }
  if (status.reason === 'update') {
    return 'System update in progress – write operations are temporarily blocked.';
  }
  if (status.reason === 'platform-import') {
    return 'Platform import in progress – write operations are temporarily blocked.';
  }
  return 'Backup in progress – write operations are temporarily blocked.';
}

function bannerColor(status: MaintenanceStatus): string {
  if (status.reason === 'restore') return 'orange.9';
  if (status.reason === 'update') return 'grape.9';
  if (status.reason === 'platform-import') return 'violet.9';
  return 'blue.9';
}

function showLongRunningHint(elapsedMs: number | null): boolean {
  return elapsedMs != null && elapsedMs >= TEN_MINUTES_MS;
}

export function AppShellMaintenanceBanner({ status, hidden = false }: Props) {
  const elapsed = useElapsedSince(status?.startedAt);
  const elapsedMs = useElapsedMs(status?.startedAt);
  const longRunning = showLongRunningHint(elapsedMs);

  if (hidden || !status?.active) return null;

  const message = [
    bannerMessage(status),
    elapsed != null ? ` Started ${elapsed} ago.` : '',
    longRunning ? ' If this seems stuck, wait 10 minutes and try again, or check server logs.' : '',
  ].join('');

  return <AppShellStatusBannerBar bg={bannerColor(status)} message={message} loader />;
}
