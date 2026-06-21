import type { LiveClientEvent } from './liveEventTypes.js';
import { serializeLiveClientEvent } from './liveEventTypes.js';

export function formatSseDataFrame(event: LiveClientEvent): string {
  return `data: ${serializeLiveClientEvent(event)}\n\n`;
}

export function formatSsePingFrame(): string {
  return 'event: ping\ndata: {}\n\n';
}

export function writeSseFrame(write: (chunk: string) => void, frame: string): boolean {
  try {
    write(frame);
    return true;
  } catch {
    return false;
  }
}
