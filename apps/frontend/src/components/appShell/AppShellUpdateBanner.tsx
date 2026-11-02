import type { UpdateOverlayPhase } from '../../hooks/useUpdateInProgressOverlay.js';
import { AppShellStatusBannerBar } from './AppShellStatusBannerBar.js';

type Props = {
  visible: boolean;
  phase: UpdateOverlayPhase;
  onReload: () => void;
};

function bannerText(phase: UpdateOverlayPhase): string {
  switch (phase) {
    case 'restarting':
      return 'Services are restarting. Connection errors are expected.';
    case 'reload':
      return 'Update may be complete. Reload this page to use the new version.';
    case 'preparing':
    default:
      return 'System update in progress. Write operations may be temporarily blocked.';
  }
}

export function AppShellUpdateBanner({ visible, phase, onReload }: Props) {
  if (!visible) return null;

  const showLoader = phase === 'preparing' || phase === 'restarting';
  const showReloadButton = phase === 'reload';

  return (
    <AppShellStatusBannerBar
      bg="grape.9"
      message={bannerText(phase)}
      loader={showLoader}
      action={
        showReloadButton ? { label: 'Reload page', onClick: onReload, color: 'grape' } : undefined
      }
    />
  );
}
