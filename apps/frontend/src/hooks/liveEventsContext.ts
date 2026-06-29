import { createContext, useContext } from 'react';

export type LiveEventsStatus = 'connected' | 'reconnecting' | 'disconnected';

export type LiveEventsContextValue = {
  status: LiveEventsStatus;
  retryConnect: () => void;
};

const defaultValue: LiveEventsContextValue = {
  status: 'reconnecting',
  retryConnect: () => {},
};

export const LiveEventsContext = createContext<LiveEventsContextValue>(defaultValue);

export function useLiveEventsContext(): LiveEventsContextValue {
  return useContext(LiveEventsContext);
}
