import type { FastifyBaseLogger } from 'fastify';
import type { LiveClientEvent } from './liveEventTypes.js';
import { formatSseDataFrame, writeSseFrame } from './liveEventSse.js';

export type SseConnection = {
  id: string;
  userId: string;
  write: (chunk: string) => void;
  close: () => void;
};

export type LiveEventRegistryStats = {
  connections: number;
  uniqueUsers: number;
};

let connectionSeq = 0;

function nextConnectionId(): string {
  connectionSeq += 1;
  return `sse-${connectionSeq}`;
}

const connectionsByUser = new Map<string, Set<SseConnection>>();

function recomputeStats(): LiveEventRegistryStats {
  let connections = 0;
  for (const set of connectionsByUser.values()) {
    connections += set.size;
  }
  return { connections, uniqueUsers: connectionsByUser.size };
}

export function getLiveEventRegistryStats(): LiveEventRegistryStats {
  return recomputeStats();
}

export function registerLiveEventConnection(
  userId: string,
  handlers: { write: (chunk: string) => void; close: () => void },
  logger?: FastifyBaseLogger
): SseConnection {
  const connection: SseConnection = {
    id: nextConnectionId(),
    userId,
    write: handlers.write,
    close: handlers.close,
  };

  let bucket = connectionsByUser.get(userId);
  if (!bucket) {
    bucket = new Set();
    connectionsByUser.set(userId, bucket);
  }
  bucket.add(connection);

  const stats = recomputeStats();
  logger?.info(
    { userId, connectionId: connection.id, ...stats },
    'SSE live event connection registered'
  );

  return connection;
}

export function unregisterLiveEventConnection(
  connection: SseConnection,
  logger?: FastifyBaseLogger
): void {
  const bucket = connectionsByUser.get(connection.userId);
  if (bucket) {
    bucket.delete(connection);
    if (bucket.size === 0) {
      connectionsByUser.delete(connection.userId);
    }
  }

  const stats = recomputeStats();
  logger?.info(
    { userId: connection.userId, connectionId: connection.id, ...stats },
    'SSE live event connection unregistered'
  );
}

function deliverToConnection(connection: SseConnection, event: LiveClientEvent): void {
  const ok = writeSseFrame(connection.write, formatSseDataFrame(event));
  if (!ok) {
    connection.close();
    unregisterLiveEventConnection(connection);
  }
}

export function broadcastLiveEventToUser(userId: string, event: LiveClientEvent): number {
  const bucket = connectionsByUser.get(userId);
  if (!bucket || bucket.size === 0) return 0;

  let delivered = 0;
  for (const connection of [...bucket]) {
    deliverToConnection(connection, event);
    delivered += 1;
  }
  return delivered;
}

export function broadcastLiveEventToAll(event: LiveClientEvent): number {
  let delivered = 0;
  for (const bucket of connectionsByUser.values()) {
    for (const connection of [...bucket]) {
      deliverToConnection(connection, event);
      delivered += 1;
    }
  }
  return delivered;
}

export function clearLiveEventRegistry(): void {
  for (const bucket of connectionsByUser.values()) {
    for (const connection of [...bucket]) {
      try {
        connection.close();
      } catch {
        // ignore close errors during shutdown
      }
    }
  }
  connectionsByUser.clear();
}
