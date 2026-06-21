import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../../app.js';
import { prisma } from '../../../db.js';
import { hashPassword } from '../../auth/services/password.js';

const TS = `assignments-${Date.now()}`;
const PASSWORD = 'testpass';

function cookieFrom(setCookie: string | string[] | undefined): string {
  if (Array.isArray(setCookie))
    return setCookie
      .map((s) => s.split(';')[0].trim())
      .filter(Boolean)
      .join('; ');
  if (typeof setCookie === 'string') return setCookie.split(';')[0].trim();
  return '';
}

describe('assignments routes (scope role exclusivity)', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let adminId: string;
  let platformAdminId: string;
  let plainUserId: string;
  let companyId: string;
  let departmentId: string;
  let teamId: string;

  beforeAll(async () => {
    app = await buildApp();
    const pw = await hashPassword(PASSWORD);
    const company = await prisma.company.create({ data: { name: `Assign Co ${TS}` } });
    companyId = company.id;
    const department = await prisma.department.create({
      data: { name: `Assign Dept ${TS}`, companyId },
    });
    departmentId = department.id;
    const team = await prisma.team.create({
      data: { name: `Assign Team ${TS}`, departmentId },
    });
    teamId = team.id;

    const [admin, platformAdmin, plain] = await Promise.all([
      prisma.user.create({
        data: {
          name: 'Struct Admin',
          email: `struct-admin-${TS}@test.de`,
          passwordHash: pw,
          isAdmin: true,
        },
      }),
      prisma.user.create({
        data: {
          name: 'Platform Admin',
          email: `platform-admin-${TS}@test.de`,
          passwordHash: pw,
          isAdmin: true,
        },
      }),
      prisma.user.create({
        data: { name: 'Plain', email: `plain-${TS}@test.de`, passwordHash: pw },
      }),
    ]);
    adminId = admin.id;
    platformAdminId = platformAdmin.id;
    plainUserId = plain.id;

    await prisma.user.updateMany({
      where: { id: { notIn: [adminId, platformAdminId, plainUserId] } },
      data: { isAdmin: false },
    });
  });

  afterAll(async () => {
    await prisma.teamLead.deleteMany({ where: { teamId } });
    await prisma.teamMember.deleteMany({ where: { teamId } });
    await prisma.team.deleteMany({ where: { id: teamId } });
    await prisma.department.deleteMany({ where: { id: departmentId } });
    await prisma.company.deleteMany({ where: { id: companyId } });
    await prisma.session.deleteMany({
      where: { userId: { in: [adminId, platformAdminId, plainUserId] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [adminId, platformAdminId, plainUserId] } },
    });
    await app.close();
  });

  async function loginAsAdmin(): Promise<string> {
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: `struct-admin-${TS}@test.de`, password: PASSWORD },
    });
    expect(loginRes.statusCode).toBe(204);
    return cookieFrom(loginRes.headers['set-cookie']);
  }

  it('POST team member for platform admin → 409', async () => {
    const cookie = await loginAsAdmin();
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/teams/${teamId}/members`,
      headers: { cookie, 'content-type': 'application/json' },
      payload: { userId: platformAdminId },
    });
    expect(res.statusCode).toBe(409);
    const body = res.json() as { error: string };
    expect(body.error).toContain('platform administrator');
  });

  it('POST team lead without prior membership → 201', async () => {
    const cookie = await loginAsAdmin();
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/teams/${teamId}/team-leads`,
      headers: { cookie, 'content-type': 'application/json' },
      payload: { userId: plainUserId },
    });
    expect(res.statusCode).toBe(201);
  });

  it('POST team member for user who is already team lead → 409', async () => {
    const cookie = await loginAsAdmin();
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/teams/${teamId}/members`,
      headers: { cookie, 'content-type': 'application/json' },
      payload: { userId: plainUserId },
    });
    expect(res.statusCode).toBe(409);
  });
});
