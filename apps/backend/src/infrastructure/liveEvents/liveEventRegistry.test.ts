import { describe, expect, it, beforeEach } from 'vitest';
import {
  broadcastLiveEventToAll,
  broadcastLiveEventToUser,
  clearLiveEventRegistry,
  getLiveEventRegistryStats,
  registerLiveEventConnection,
  unregisterLiveEventConnection,
} from './liveEventRegistry.js';

describe('liveEventRegistry', () => {
  beforeEach(() => {
    clearLiveEventRegistry();
  });

  it('tracks connection stats', () => {
    expect(getLiveEventRegistryStats()).toEqual({ connections: 0, uniqueUsers: 0 });

    const chunks: string[] = [];
    registerLiveEventConnection('user-a', {
      write: (c) => chunks.push(c),
      close: () => {},
    });
    registerLiveEventConnection('user-a', {
      write: (c) => chunks.push(c),
      close: () => {},
    });
    registerLiveEventConnection('user-b', {
      write: (c) => chunks.push(c),
      close: () => {},
    });

    expect(getLiveEventRegistryStats()).toEqual({ connections: 3, uniqueUsers: 2 });
  });

  it('broadcasts to user and all targets', () => {
    const userA: string[] = [];
    const userB: string[] = [];

    registerLiveEventConnection('user-a', {
      write: (c) => userA.push(c),
      close: () => {},
    });
    registerLiveEventConnection('user-b', {
      write: (c) => userB.push(c),
      close: () => {},
    });

    const userDelivered = broadcastLiveEventToUser('user-a', {
      v: 1,
      type: 'notification.unread-changed',
    });
    expect(userDelivered).toBe(1);
    expect(userA).toHaveLength(1);
    expect(userB).toHaveLength(0);

    const allDelivered = broadcastLiveEventToAll({
      v: 1,
      type: 'maintenance.status-changed',
      payload: { active: true, reason: 'backup' },
    });
    expect(allDelivered).toBe(2);
    expect(userB).toHaveLength(1);
  });

  it('unregisters connections', () => {
    const conn = registerLiveEventConnection('user-a', {
      write: () => {},
      close: () => {},
    });
    unregisterLiveEventConnection(conn);
    expect(getLiveEventRegistryStats()).toEqual({ connections: 0, uniqueUsers: 0 });
  });
});
