import { createContext, useContext } from 'react';

export type LiveEventsContextValue = {
  /** True when SSE failed persistently and unread fallback polling should run. */
  fallbackPollingActive: boolean;
};

const defaultValue: LiveEventsContextValue = {
  fallbackPollingActive: false,
};

export const LiveEventsContext = createContext<LiveEventsContextValue>(defaultValue);

export function useLiveEventsContext(): LiveEventsContextValue {
  return useContext(LiveEventsContext);
}
