export const LIVE_EVENTS_CHANNEL = 'docsops_live_events';

export function isLiveEventsEnabled(): boolean {
  const raw = process.env.LIVE_EVENTS_ENABLED;
  if (raw == null || raw.trim() === '') return true;
  return raw.toLowerCase() === 'true' || raw === '1';
}

export function getLiveEventsHeartbeatIntervalMs(): number {
  const raw = process.env.LIVE_EVENTS_HEARTBEAT_SECONDS;
  if (raw == null || raw.trim() === '') return 30_000;
  const seconds = Number.parseInt(raw, 10);
  if (!Number.isFinite(seconds) || seconds < 5) return 30_000;
  if (seconds > 300) return 300_000;
  return seconds * 1000;
}

export function getDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL?.trim();
  return raw && raw.length > 0 ? raw : 'postgresql://app:app@localhost:5432/docsops';
}
