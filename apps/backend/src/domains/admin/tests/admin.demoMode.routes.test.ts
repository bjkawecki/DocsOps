import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../../../app.js';
import { prisma } from '../../../db.js';
import { hashPassword } from '../../auth/services/password.js';

const TS = Date.now();
const ADMIN_EMAIL = `demo-admin-${TS}@example.com`;
const PASSWORD = 'testpass123';

function getCookieHeader(res: { headers: Record<string, unknown> }): string {
  const setCookie = res.headers['set-cookie'];
  if (Array.isArray(setCookie)) return setCookie.join('; ');
  if (typeof setCookie === 'string') return setCookie;
  return '';
}

describe('Admin mutations blocked in DEMO_MODE', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let adminId: string;
  let cookie: string;
  let prevDemo: string | undefined;

  beforeAll(async () => {
    prevDemo = process.env.DEMO_MODE;
    process.env.DEMO_MODE = 'true';
    app = await buildApp();
    const passwordHash = await hashPassword(PASSWORD);
    const admin = await prisma.user.create({
      data: { name: 'Demo Guard Admin', email: ADMIN_EMAIL, passwordHash, isAdmin: true },
    });
    adminId = admin.id;
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: ADMIN_EMAIL, password: PASSWORD },
    });
    expect(loginRes.statusCode).toBe(204);
    cookie = getCookieHeader(loginRes);
  });

  afterAll(async () => {
    if (adminId) {
      await prisma.session.deleteMany({ where: { userId: adminId } });
      await prisma.user.deleteMany({ where: { id: adminId } });
    }
    await app?.close();
    if (prevDemo === undefined) delete process.env.DEMO_MODE;
    else process.env.DEMO_MODE = prevDemo;
  });

  it('GET /admin/users still allowed', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/users',
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
  });

  it('POST /admin/users → 403', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/users',
      headers: { cookie },
      payload: {
        name: 'Blocked',
        email: `blocked-${TS}@example.com`,
        password: 'password12',
      },
    });
    expect(res.statusCode).toBe(403);
  });

  it('POST /admin/updates/apply → 403', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/updates/apply',
      headers: { cookie },
    });
    expect(res.statusCode).toBe(403);
  });

  it('POST /admin/notifications/broadcast → 403', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/notifications/broadcast',
      headers: { cookie },
      payload: { title: 'x', body: 'y' },
    });
    expect(res.statusCode).toBe(403);
  });

  it('POST /admin/platform-exports → 403', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/platform-exports',
      headers: { cookie },
    });
    expect(res.statusCode).toBe(403);
  });

  it('POST /admin/backups → 403', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/backups',
      headers: { cookie },
    });
    expect(res.statusCode).toBe(403);
  });
});
