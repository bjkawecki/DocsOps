import { describe, expect, it } from 'vitest';
import {
  LIVE_EVENT_VERSION,
  liveClientEventSchema,
  liveNotifyTargetSchema,
  parseLiveNotifyPayload,
  serializeLiveClientEvent,
} from './liveEventTypes.js';

describe('liveEventTypes', () => {
  it('parses notification unread NOTIFY envelope', () => {
    const raw = JSON.stringify({
      target: 'user',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      event: { v: LIVE_EVENT_VERSION, type: 'notification.unread-changed' },
    });
    const parsed = parseLiveNotifyPayload(raw);
    expect(parsed).toEqual({
      target: 'user',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      event: { v: 1, type: 'notification.unread-changed' },
    });
  });

  it('parses maintenance broadcast NOTIFY envelope', () => {
    const raw = JSON.stringify({
      target: 'all',
      event: {
        v: LIVE_EVENT_VERSION,
        type: 'maintenance.status-changed',
        payload: { active: true, reason: 'backup' },
      },
    });
    const parsed = parseLiveNotifyPayload(raw);
    expect(parsed?.target).toBe('all');
    expect(liveNotifyTargetSchema.safeParse(parsed).success).toBe(true);
  });

  it('rejects invalid NOTIFY payload', () => {
    expect(parseLiveNotifyPayload('not-json')).toBeNull();
    expect(parseLiveNotifyPayload(JSON.stringify({ target: 'nope' }))).toBeNull();
  });

  it('serializes client events', () => {
    const event = liveClientEventSchema.parse({
      v: 1,
      type: 'maintenance.status-changed',
      payload: { active: false },
    });
    expect(serializeLiveClientEvent(event)).toBe(
      '{"v":1,"type":"maintenance.status-changed","payload":{"active":false}}'
    );
  });
});
