import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Prisma } from '../../../../generated/prisma/client.js';
import { buildApp } from '../../../app.js';
import { prisma } from '../../../db.js';
import { invalidateMaintenanceLockCache } from '../../../infrastructure/maintenance/maintenancePreHandler.js';
import { hashPassword } from '../../auth/services/password.js';

const TS = Date.now();
const ADMIN_EMAIL = `restore-admin-${TS}@example.com`;
const PASSWORD = 'testpass123';

function getCookieHeader(res: { headers: Record<string, unknown> }): string {
  const setCookie = res.headers['set-cookie'];
  if (Array.isArray(setCookie)) return setCookie.join('; ');
  if (typeof setCookie === 'string') return setCookie;
  return '';
}

describe('Admin restore routes', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let adminId: string;

  beforeAll(async () => {
    app = await buildApp();
    const passwordHash = await hashPassword(PASSWORD);
    const admin = await prisma.user.create({
      data: { name: 'Restore Admin', email: ADMIN_EMAIL, passwordHash, isAdmin: true },
    });
    adminId = admin.id;
    await prisma.user.updateMany({
      where: { id: { not: adminId } },
      data: { isAdmin: false },
    });
  });

  afterAll(async () => {
    await prisma.systemMaintenanceLock.deleteMany({ where: { id: 'backup' } });
    invalidateMaintenanceLockCache();
    await prisma.adminBackupActionAudit.deleteMany({ where: { actorUserId: adminId } });
    await prisma.$executeRaw(
      Prisma.sql`DELETE FROM admin_job_action_audit WHERE actor_user_id = ${adminId}`
    );
    await prisma.restoreRun.deleteMany({});
    await prisma.backupRun.deleteMany({});
    await prisma.session.deleteMany({ where: { userId: adminId } });
    await prisma.user.delete({ where: { id: adminId } });
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

  it('GET /admin/restores without cookie → 401', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/admin/restores' });
    expect(res.statusCode).toBe(401);
  });

  it('GET /admin/restores as admin → 200', async () => {
    const cookie = await loginAs(ADMIN_EMAIL, PASSWORD);
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/restores',
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { items: unknown[]; total: number };
    expect(Array.isArray(body.items)).toBe(true);
    expect(typeof body.total).toBe('number');
  });

  it('POST /admin/restores/from-backup without local copy → 400', async () => {
    const run = await prisma.backupRun.create({
      data: {
        status: 'succeeded',
        triggerSource: 'manual',
        localObjectKey: null,
        finishedAt: new Date(),
      },
    });
    const cookie = await loginAs(ADMIN_EMAIL, PASSWORD);
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/restores/from-backup/${run.id}`,
      headers: { cookie },
    });
    expect(res.statusCode).toBe(400);
  });

  it('POST /admin/restores/from-backup with local copy → 202', async () => {
    const run = await prisma.backupRun.create({
      data: {
        status: 'succeeded',
        triggerSource: 'manual',
        localObjectKey: 'backups/test-restore/archive.tar.zst',
        finishedAt: new Date(),
      },
    });
    const cookie = await loginAs(ADMIN_EMAIL, PASSWORD);
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/restores/from-backup/${run.id}`,
      headers: { cookie },
    });
    expect(res.statusCode).toBe(202);
    const body = res.json() as { restoreRunId: string; jobId: string };
    expect(body.restoreRunId).toBeTruthy();
    expect(body.jobId).toBeTruthy();
    await prisma.restoreRun.delete({ where: { id: body.restoreRunId } });
  });
});
