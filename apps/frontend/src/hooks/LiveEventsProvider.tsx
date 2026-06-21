import type { ReactNode } from 'react';
import { LiveEventsContext } from './liveEventsContext';
import { useLiveEvents } from './useLiveEvents';

export function LiveEventsProvider({ children }: { children: ReactNode }) {
  const { fallbackPollingActive } = useLiveEvents();
  return (
    <LiveEventsContext.Provider value={{ fallbackPollingActive }}>
      {children}
    </LiveEventsContext.Provider>
  );
}
