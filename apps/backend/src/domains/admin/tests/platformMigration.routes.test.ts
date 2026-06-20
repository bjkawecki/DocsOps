import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../../app.js';
import { prisma } from '../../../db.js';
import { hashPassword } from '../../auth/services/password.js';

const TS = Date.now();
const ADMIN_EMAIL = `platform-migration-admin-${TS}@example.com`;
const USER_EMAIL = `platform-migration-user-${TS}@example.com`;
const PASSWORD = 'testpass123';

function getCookieHeader(res: { headers: Record<string, unknown> }): string {
  const setCookie = res.headers['set-cookie'];
  if (Array.isArray(setCookie)) return setCookie.join('; ');
  if (typeof setCookie === 'string') return setCookie;
  return '';
}

describe('Admin platform migration routes', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let adminId: string;
  let userId: string;

  beforeAll(async () => {
    app = await buildApp();
    const passwordHash = await hashPassword(PASSWORD);
    const admin = await prisma.user.create({
      data: { name: 'Migration Admin', email: ADMIN_EMAIL, passwordHash, isAdmin: true },
    });
    adminId = admin.id;
    const user = await prisma.user.create({
      data: { name: 'Migration User', email: USER_EMAIL, passwordHash, isAdmin: false },
    });
    userId = user.id;
  });

  afterAll(async () => {
    await prisma.adminPlatformMigrationAudit
      .deleteMany({
        where: { actorUserId: { in: [adminId, userId] } },
      })
      .catch(() => undefined);
    await prisma.platformExportRun.deleteMany({}).catch(() => undefined);
    await prisma.platformImportRun.deleteMany({}).catch(() => undefined);
    await prisma.session.deleteMany({ where: { userId: { in: [adminId, userId] } } });
    await prisma.user.deleteMany({ where: { id: { in: [adminId, userId] } } });
    await app?.close();
  });

  async function loginAs(email: string, password: string): Promise<string> {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email, password },
    });
    expect(res.statusCode).toBe(204);
    return getCookieHeader(res);
  }

  it('GET /admin/platform-exports without cookie → 401', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/admin/platform-exports' });
    expect(res.statusCode).toBe(401);
  });

  it('GET /admin/platform-exports as non-admin → 403', async () => {
    const cookie = await loginAs(USER_EMAIL, PASSWORD);
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/platform-exports',
      headers: { cookie },
    });
    expect(res.statusCode).toBe(403);
  });

  it('GET /admin/platform-exports as admin → 200', async () => {
    const cookie = await loginAs(ADMIN_EMAIL, PASSWORD);
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/platform-exports',
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { items: unknown[] };
    expect(Array.isArray(body.items)).toBe(true);
  });

  it('GET /admin/platform-imports as admin → 200', async () => {
    const cookie = await loginAs(ADMIN_EMAIL, PASSWORD);
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/platform-imports',
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { items: unknown[] };
    expect(Array.isArray(body.items)).toBe(true);
  });

  it('GET /admin/platform-migration/status as admin → 200', async () => {
    const cookie = await loginAs(ADMIN_EMAIL, PASSWORD);
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/platform-migration/status',
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      minioAvailable: boolean;
      workerConnected: boolean;
      lastExportRun: unknown;
      lastImportRun: unknown;
    };
    expect(typeof body.minioAvailable).toBe('boolean');
    expect(typeof body.workerConnected).toBe('boolean');
    expect(body.lastExportRun === null || typeof body.lastExportRun === 'object').toBe(true);
    expect(body.lastImportRun === null || typeof body.lastImportRun === 'object').toBe(true);
  });

  it('POST /admin/debug/reset-platform as admin → 200 and clears domain data', async () => {
    const cookie = await loginAs(ADMIN_EMAIL, PASSWORD);
    const company = await prisma.company.create({ data: { name: `Reset Co ${TS}` } });
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/debug/reset-platform',
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { deletedNonAdminUsers: number };
    expect(body.deletedNonAdminUsers).toBeGreaterThanOrEqual(1);
    const companyCount = await prisma.company.count();
    expect(companyCount).toBe(0);
    const adminStill = await prisma.user.findUnique({ where: { id: adminId } });
    expect(adminStill?.isAdmin).toBe(true);
    const userStill = await prisma.user.findUnique({ where: { id: userId } });
    expect(userStill).toBeNull();
    await prisma.company.deleteMany({ where: { id: company.id } }).catch(() => undefined);
  });

  it('POST /admin/debug/reseed-platform on non-empty DB → 400', async () => {
    const cookie = await loginAs(ADMIN_EMAIL, PASSWORD);
    const company = await prisma.company.create({ data: { name: `Reseed Block ${TS}` } });
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/debug/reseed-platform',
      headers: { cookie },
    });
    expect(res.statusCode).toBe(400);
    await prisma.company.deleteMany({ where: { id: company.id } });
  });

  it('POST /admin/debug/reseed-platform after reset → 200 and loads seed data', async () => {
    const cookie = await loginAs(ADMIN_EMAIL, PASSWORD);
    const resetRes = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/debug/reset-platform',
      headers: { cookie },
    });
    expect(resetRes.statusCode).toBe(200);

    const reseedRes = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/debug/reseed-platform',
      headers: { cookie },
    });
    expect(reseedRes.statusCode).toBe(200);
    const body = reseedRes.json() as { seeded: boolean };
    expect(body.seeded).toBe(true);
    const companyCount = await prisma.company.count();
    expect(companyCount).toBeGreaterThan(0);
  });
});
