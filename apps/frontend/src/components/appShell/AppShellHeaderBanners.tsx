import type { MaintenanceStatus } from '../../hooks/useMaintenanceStatus.js';
import type { UpdateOverlayPhase } from '../../hooks/useUpdateInProgressOverlay.js';
import { useLiveEventsContext } from '../../hooks/liveEventsContext.js';
import { AppShellLiveEventsBanner } from './AppShellLiveEventsBanner.js';
import { AppShellMaintenanceBanner } from './AppShellMaintenanceBanner.js';
import { AppShellUpdateBanner } from './AppShellUpdateBanner.js';

type Props = {
  updateVisible: boolean;
  updatePhase: UpdateOverlayPhase;
  onUpdateReload: () => void;
  maintenanceStatus: MaintenanceStatus | undefined;
};

export function AppShellHeaderBanners({
  updateVisible,
  updatePhase,
  onUpdateReload,
  maintenanceStatus,
}: Props) {
  const { status, retryConnect } = useLiveEventsContext();

  return (
    <>
      <AppShellUpdateBanner visible={updateVisible} phase={updatePhase} onReload={onUpdateReload} />
      <AppShellMaintenanceBanner status={maintenanceStatus} hidden={updateVisible} />
      {/* Hide during system update; update banner already covers expected disconnects. */}
      {!updateVisible ? <AppShellLiveEventsBanner status={status} onRetry={retryConnect} /> : null}
    </>
  );
}

export function countVisibleAppShellHeaderBanners(args: {
  updateVisible: boolean;
  maintenanceStatus: MaintenanceStatus | undefined;
  liveEventsStatus: 'connected' | 'reconnecting' | 'disconnected';
}): number {
  let count = 0;
  if (args.updateVisible) count += 1;
  if (!args.updateVisible && args.maintenanceStatus?.active) count += 1;
  if (!args.updateVisible && args.liveEventsStatus !== 'connected') count += 1;
  return count;
}
