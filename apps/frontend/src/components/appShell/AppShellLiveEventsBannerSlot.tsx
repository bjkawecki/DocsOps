import { AppShellLiveEventsBanner } from './AppShellLiveEventsBanner.js';
import { useLiveEventsContext } from '../../hooks/liveEventsContext.js';

export function AppShellLiveEventsBannerSlot() {
  const { status, retryConnect } = useLiveEventsContext();
  return <AppShellLiveEventsBanner status={status} onRetry={retryConnect} />;
}
