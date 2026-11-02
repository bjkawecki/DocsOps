import { Client } from 'pg';
import type { FastifyBaseLogger } from 'fastify';
import {
  broadcastLiveEventToAll,
  broadcastLiveEventToUser,
  clearLiveEventRegistry,
} from './liveEventRegistry.js';
import { getDatabaseUrl, isLiveEventsEnabled, LIVE_EVENTS_CHANNEL } from './liveEventConfig.js';
import { parseLiveNotifyPayload } from './liveEventTypes.js';

let listenClient: Client | null = null;
let started = false;

function dispatchNotifyPayload(raw: string, logger?: FastifyBaseLogger): void {
  const envelope = parseLiveNotifyPayload(raw);
  if (!envelope) {
    logger?.warn({ raw }, 'Ignored invalid live event NOTIFY payload');
    return;
  }

  if (envelope.target === 'user') {
    const count = broadcastLiveEventToUser(envelope.userId, envelope.event);
    logger?.debug(
      { userId: envelope.userId, type: envelope.event.type, delivered: count },
      'Dispatched live event to user'
    );
    return;
  }

  const count = broadcastLiveEventToAll(envelope.event);
  logger?.debug({ type: envelope.event.type, delivered: count }, 'Dispatched live event broadcast');
}

export async function startLiveEventListener(logger?: FastifyBaseLogger): Promise<void> {
  if (!isLiveEventsEnabled() || started) return;

  const client = new Client({ connectionString: getDatabaseUrl() });
  client.on('error', (err) => {
    logger?.error({ err }, 'Live events LISTEN client error');
  });
  client.on('notification', (msg) => {
    if (msg.channel !== LIVE_EVENTS_CHANNEL || msg.payload == null) return;
    dispatchNotifyPayload(msg.payload, logger);
  });

  await client.connect();
  await client.query(`LISTEN ${LIVE_EVENTS_CHANNEL}`);

  listenClient = client;
  started = true;
  logger?.info({ channel: LIVE_EVENTS_CHANNEL }, 'Live events LISTEN started');
}

export async function stopLiveEventListener(logger?: FastifyBaseLogger): Promise<void> {
  clearLiveEventRegistry();

  if (!listenClient) {
    started = false;
    return;
  }

  const client = listenClient;
  listenClient = null;
  started = false;

  try {
    await client.query(`UNLISTEN ${LIVE_EVENTS_CHANNEL}`);
  } catch (err) {
    logger?.warn({ err }, 'Failed to UNLISTEN live events channel');
  }

  try {
    await client.end();
  } catch (err) {
    logger?.warn({ err }, 'Failed to close live events LISTEN client');
  }

  logger?.info('Live events LISTEN stopped');
}

export function isLiveEventListenerStarted(): boolean {
  return started;
}
