import type { ReactNode } from 'react';
import { LiveEventsContext } from './liveEventsContext';
import { useLiveEvents } from './useLiveEvents';

export function LiveEventsProvider({ children }: { children: ReactNode }) {
  const { status, retryConnect } = useLiveEvents();
  return (
    <LiveEventsContext.Provider value={{ status, retryConnect }}>
      {children}
    </LiveEventsContext.Provider>
  );
}
