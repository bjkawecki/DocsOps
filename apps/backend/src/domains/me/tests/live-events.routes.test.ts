import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { buildApp } from '../../../app.js';
import { prisma } from '../../../db.js';
import { hashPassword } from '../../auth/services/password.js';
import {
  clearLiveEventRegistry,
  getLiveEventRegistryStats,
} from '../../../infrastructure/liveEvents/liveEventRegistry.js';

const TEST_EMAIL = `live-events-${Date.now()}@example.com`;
const TEST_PASSWORD = 'testpass';

function getCookieHeader(res: { headers: Record<string, unknown> }): string {
  const setCookie = res.headers['set-cookie'];
  if (Array.isArray(setCookie)) return setCookie.join('; ');
  if (typeof setCookie === 'string') return setCookie;
  return '';
}

describe('GET /api/v1/me/events', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let testUserId: string;

  beforeAll(async () => {
    app = await buildApp();
    const passwordHash = await hashPassword(TEST_PASSWORD);
    const user = await prisma.user.create({
      data: {
        name: 'Live Events Test User',
        email: TEST_EMAIL,
        passwordHash,
      },
    });
    testUserId = user.id;
  });

  beforeEach(() => {
    clearLiveEventRegistry();
  });

  afterAll(async () => {
    if (testUserId) {
      await prisma.session.deleteMany({ where: { userId: testUserId } });
      await prisma.user.deleteMany({ where: { id: testUserId } });
    }
    await app.close();
  });

  it('returns 401 without session cookie', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/me/events' });
    expect(res.statusCode).toBe(401);
  });

  it('returns 503 when live events are disabled', async () => {
    const prev = process.env.LIVE_EVENTS_ENABLED;
    process.env.LIVE_EVENTS_ENABLED = 'false';
    try {
      const loginRes = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: { email: TEST_EMAIL, password: TEST_PASSWORD },
      });
      const cookie = getCookieHeader(loginRes);
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/me/events',
        headers: { cookie },
      });
      expect(res.statusCode).toBe(503);
      const body = res.json() as { code?: string };
      expect(body.code).toBe('LIVE_EVENTS_DISABLED');
    } finally {
      if (prev == null) delete process.env.LIVE_EVENTS_ENABLED;
      else process.env.LIVE_EVENTS_ENABLED = prev;
    }
  });

  it('includes liveEvents stats in /ready when enabled', async () => {
    const res = await app.inject({ method: 'GET', url: '/ready' });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      status: string;
      liveEvents?: { enabled: boolean; connections: number; uniqueUsers: number };
    };
    expect(body.status).toBe('ok');
    expect(body.liveEvents).toEqual({
      enabled: true,
      connections: getLiveEventRegistryStats().connections,
      uniqueUsers: getLiveEventRegistryStats().uniqueUsers,
    });
  });
});
