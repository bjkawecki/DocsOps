import type { LiveEventsStatus } from '../../hooks/liveEventsContext.js';
import { AppShellStatusBannerBar } from './AppShellStatusBannerBar.js';

type Props = {
  status: LiveEventsStatus;
  onRetry: () => void;
};

export function AppShellLiveEventsBanner({ status, onRetry }: Props) {
  if (status === 'connected') return null;

  if (status === 'reconnecting') {
    return <AppShellStatusBannerBar bg="yellow.7" message="Reconnecting to live updates…" loader />;
  }

  return (
    <AppShellStatusBannerBar
      bg="red.8"
      message="The connection to the server was lost. Document and notification updates may be outdated until the connection is restored."
      action={{ label: 'Retry now', onClick: onRetry, color: 'red' }}
    />
  );
}
