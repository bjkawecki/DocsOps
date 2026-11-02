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
    try {
      const userIds = [adminId, platformAdminId, plainUserId].filter(Boolean);
      if (userIds.length > 0) {
        await prisma.companyAuthor.deleteMany({ where: { userId: { in: userIds } } });
        await prisma.departmentAuthor.deleteMany({ where: { userId: { in: userIds } } });
        await prisma.teamAuthor.deleteMany({ where: { userId: { in: userIds } } });
        await prisma.session.deleteMany({ where: { userId: { in: userIds } } });
        await prisma.user.deleteMany({ where: { id: { in: userIds } } });
      }
      if (teamId) {
        await prisma.teamAuthor.deleteMany({ where: { teamId } });
        await prisma.teamLead.deleteMany({ where: { teamId } });
        await prisma.teamMember.deleteMany({ where: { teamId } });
        await prisma.team.deleteMany({ where: { id: teamId } });
      }
      if (departmentId) {
        await prisma.departmentLead.deleteMany({ where: { departmentId } });
        await prisma.departmentAuthor.deleteMany({ where: { departmentId } });
        await prisma.department.deleteMany({ where: { id: departmentId } });
      }
      if (companyId) {
        await prisma.companyAuthor.deleteMany({ where: { companyId } });
        await prisma.company.deleteMany({ where: { id: companyId } });
      }
    } finally {
      await app?.close();
    }
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

  it('POST team author requires membership → promote keeps membership; demote removes author only', async () => {
    const cookie = await loginAsAdmin();
    await prisma.teamLead.deleteMany({ where: { teamId, userId: plainUserId } });
    await prisma.teamAuthor.deleteMany({ where: { teamId, userId: plainUserId } });
    await prisma.teamMember.deleteMany({ where: { teamId, userId: plainUserId } });

    const noMember = await app.inject({
      method: 'POST',
      url: `/api/v1/teams/${teamId}/authors`,
      headers: { cookie, 'content-type': 'application/json' },
      payload: { userId: plainUserId },
    });
    expect(noMember.statusCode).toBe(409);

    await app.inject({
      method: 'POST',
      url: `/api/v1/teams/${teamId}/members`,
      headers: { cookie, 'content-type': 'application/json' },
      payload: { userId: plainUserId },
    });

    const promote = await app.inject({
      method: 'POST',
      url: `/api/v1/teams/${teamId}/authors`,
      headers: { cookie, 'content-type': 'application/json' },
      payload: { userId: plainUserId },
    });
    expect(promote.statusCode).toBe(201);

    const memberAfterPromote = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: plainUserId } },
    });
    expect(memberAfterPromote).not.toBeNull();

    const demote = await app.inject({
      method: 'DELETE',
      url: `/api/v1/teams/${teamId}/authors/${plainUserId}`,
      headers: { cookie },
    });
    expect(demote.statusCode).toBe(204);

    const memberAfterDemote = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: plainUserId } },
    });
    expect(memberAfterDemote).not.toBeNull();
  });

  it('POST department author keeps membership; demote without teamId', async () => {
    const cookie = await loginAsAdmin();
    await prisma.teamLead.deleteMany({ where: { teamId, userId: plainUserId } });
    await prisma.teamAuthor.deleteMany({ where: { teamId, userId: plainUserId } });
    await prisma.departmentAuthor.deleteMany({ where: { departmentId, userId: plainUserId } });
    await prisma.teamMember.deleteMany({ where: { teamId, userId: plainUserId } });

    await app.inject({
      method: 'POST',
      url: `/api/v1/teams/${teamId}/members`,
      headers: { cookie, 'content-type': 'application/json' },
      payload: { userId: plainUserId },
    });

    const promote = await app.inject({
      method: 'POST',
      url: `/api/v1/departments/${departmentId}/authors`,
      headers: { cookie, 'content-type': 'application/json' },
      payload: { userId: plainUserId },
    });
    expect(promote.statusCode).toBe(201);

    const memberAfterPromote = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: plainUserId } },
    });
    expect(memberAfterPromote).not.toBeNull();

    const demote = await app.inject({
      method: 'DELETE',
      url: `/api/v1/departments/${departmentId}/authors/${plainUserId}`,
      headers: { cookie },
    });
    expect(demote.statusCode).toBe(204);
  });

  it('POST company author keeps membership; demote without teamId; non-lead denied', async () => {
    const cookie = await loginAsAdmin();
    await prisma.teamLead.deleteMany({ where: { teamId, userId: plainUserId } });
    await prisma.teamAuthor.deleteMany({ where: { teamId, userId: plainUserId } });
    await prisma.departmentAuthor.deleteMany({ where: { departmentId, userId: plainUserId } });
    await prisma.companyAuthor.deleteMany({ where: { companyId, userId: plainUserId } });
    await prisma.teamMember.deleteMany({ where: { teamId, userId: plainUserId } });

    await app.inject({
      method: 'POST',
      url: `/api/v1/teams/${teamId}/members`,
      headers: { cookie, 'content-type': 'application/json' },
      payload: { userId: plainUserId },
    });

    const promote = await app.inject({
      method: 'POST',
      url: `/api/v1/companies/${companyId}/authors`,
      headers: { cookie, 'content-type': 'application/json' },
      payload: { userId: plainUserId },
    });
    expect(promote.statusCode).toBe(201);

    const memberAfterPromote = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: plainUserId } },
    });
    expect(memberAfterPromote).not.toBeNull();

    const plainLogin = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: `plain-${TS}@test.de`, password: PASSWORD },
    });
    const plainCookie = cookieFrom(plainLogin.headers['set-cookie']);
    const denied = await app.inject({
      method: 'POST',
      url: `/api/v1/companies/${companyId}/authors`,
      headers: { cookie: plainCookie, 'content-type': 'application/json' },
      payload: { userId: adminId },
    });
    expect(denied.statusCode).toBe(403);

    const demote = await app.inject({
      method: 'DELETE',
      url: `/api/v1/companies/${companyId}/authors/${plainUserId}`,
      headers: { cookie },
    });
    expect(demote.statusCode).toBe(204);
  });

  it('POST team author blocked when user is team lead', async () => {
    const cookie = await loginAsAdmin();
    await prisma.teamAuthor.deleteMany({ where: { teamId, userId: plainUserId } });
    await prisma.teamMember.deleteMany({ where: { teamId, userId: plainUserId } });
    await prisma.teamLead.deleteMany({ where: { teamId } });
    await prisma.teamLead.create({ data: { teamId, userId: plainUserId } });

    const promote = await app.inject({
      method: 'POST',
      url: `/api/v1/teams/${teamId}/authors`,
      headers: { cookie, 'content-type': 'application/json' },
      payload: { userId: plainUserId },
    });
    expect(promote.statusCode).toBe(409);

    await prisma.teamLead.deleteMany({ where: { teamId, userId: plainUserId } });
  });
});

describe('assignments routes (single team/department lead)', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let adminId: string;
  let leadAId: string;
  let leadBId: string;
  let companyId: string;
  let departmentId: string;
  let teamId: string;

  beforeAll(async () => {
    app = await buildApp();
    const pw = await hashPassword(PASSWORD);
    const company = await prisma.company.create({ data: { name: `Lead1 Co ${TS}` } });
    companyId = company.id;
    const department = await prisma.department.create({
      data: { name: `Lead1 Dept ${TS}`, companyId },
    });
    departmentId = department.id;
    const team = await prisma.team.create({
      data: { name: `Lead1 Team ${TS}`, departmentId },
    });
    teamId = team.id;

    const [admin, leadA, leadB] = await Promise.all([
      prisma.user.create({
        data: {
          name: 'Lead1 Admin',
          email: `lead1-admin-${TS}@test.de`,
          passwordHash: pw,
          isAdmin: true,
        },
      }),
      prisma.user.create({
        data: { name: 'Lead A', email: `lead-a-${TS}@test.de`, passwordHash: pw },
      }),
      prisma.user.create({
        data: { name: 'Lead B', email: `lead-b-${TS}@test.de`, passwordHash: pw },
      }),
    ]);
    adminId = admin.id;
    leadAId = leadA.id;
    leadBId = leadB.id;
  });

  afterAll(async () => {
    try {
      const userIds = [adminId, leadAId, leadBId].filter(Boolean);
      if (userIds.length > 0) {
        await prisma.companyLead.deleteMany({ where: { userId: { in: userIds } } });
        await prisma.session.deleteMany({ where: { userId: { in: userIds } } });
        await prisma.user.deleteMany({ where: { id: { in: userIds } } });
      }
      if (teamId) {
        await prisma.teamLead.deleteMany({ where: { teamId } });
        await prisma.team.deleteMany({ where: { id: teamId } });
      }
      if (departmentId) {
        await prisma.departmentLead.deleteMany({ where: { departmentId } });
        await prisma.department.deleteMany({ where: { id: departmentId } });
      }
      if (companyId) {
        await prisma.companyLead.deleteMany({ where: { companyId } });
        await prisma.company.deleteMany({ where: { id: companyId } });
      }
    } finally {
      await app?.close();
    }
  });

  async function loginAsAdmin(): Promise<string> {
    await prisma.user.update({ where: { id: adminId }, data: { isAdmin: true } });
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: `lead1-admin-${TS}@test.de`, password: PASSWORD },
    });
    expect(loginRes.statusCode).toBe(204);
    return cookieFrom(loginRes.headers['set-cookie']);
  }

  it('POST team lead then same user → 409 ALREADY_TEAM_LEAD; other user → replace', async () => {
    const cookie = await loginAsAdmin();
    await prisma.teamLead.deleteMany({ where: { teamId } });

    const first = await app.inject({
      method: 'POST',
      url: `/api/v1/teams/${teamId}/team-leads`,
      headers: { cookie, 'content-type': 'application/json' },
      payload: { userId: leadAId },
    });
    expect(first.statusCode).toBe(201);

    const same = await app.inject({
      method: 'POST',
      url: `/api/v1/teams/${teamId}/team-leads`,
      headers: { cookie, 'content-type': 'application/json' },
      payload: { userId: leadAId },
    });
    expect(same.statusCode).toBe(409);
    expect((same.json() as { code: string }).code).toBe('ALREADY_TEAM_LEAD');

    const replace = await app.inject({
      method: 'POST',
      url: `/api/v1/teams/${teamId}/team-leads`,
      headers: { cookie, 'content-type': 'application/json' },
      payload: { userId: leadBId },
    });
    expect(replace.statusCode).toBe(200);
    const row = await prisma.teamLead.findUnique({ where: { teamId } });
    expect(row?.userId).toBe(leadBId);
    expect(await prisma.teamLead.count({ where: { teamId } })).toBe(1);
  });

  it('DELETE sole team lead → 409 LAST_TEAM_LEAD', async () => {
    const cookie = await loginAsAdmin();
    await prisma.teamLead.deleteMany({ where: { teamId } });
    await prisma.teamLead.create({ data: { teamId, userId: leadAId } });

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/teams/${teamId}/team-leads/${leadAId}`,
      headers: { cookie },
    });
    expect(res.statusCode).toBe(409);
    expect((res.json() as { code: string }).code).toBe('LAST_TEAM_LEAD');
    expect(await prisma.teamLead.count({ where: { teamId } })).toBe(1);
  });

  it('POST department lead replace and DELETE last → 409', async () => {
    const cookie = await loginAsAdmin();
    await prisma.teamLead.deleteMany({ where: { teamId } });
    await prisma.departmentLead.deleteMany({ where: { departmentId } });

    const first = await app.inject({
      method: 'POST',
      url: `/api/v1/departments/${departmentId}/department-leads`,
      headers: { cookie, 'content-type': 'application/json' },
      payload: { userId: leadAId },
    });
    expect(first.statusCode).toBe(201);

    const replace = await app.inject({
      method: 'POST',
      url: `/api/v1/departments/${departmentId}/department-leads`,
      headers: { cookie, 'content-type': 'application/json' },
      payload: { userId: leadBId },
    });
    expect(replace.statusCode).toBe(200);
    expect(await prisma.departmentLead.count({ where: { departmentId } })).toBe(1);
    expect((await prisma.departmentLead.findUnique({ where: { departmentId } }))?.userId).toBe(
      leadBId
    );

    const del = await app.inject({
      method: 'DELETE',
      url: `/api/v1/departments/${departmentId}/department-leads/${leadBId}`,
      headers: { cookie },
    });
    expect(del.statusCode).toBe(409);
    expect((del.json() as { code: string }).code).toBe('LAST_DEPARTMENT_LEAD');
  });

  it('Company still allows multiple leads', async () => {
    const cookie = await loginAsAdmin();
    await prisma.teamLead.deleteMany({ where: { teamId } });
    await prisma.departmentLead.deleteMany({ where: { departmentId } });
    await prisma.companyLead.deleteMany({ where: { companyId } });

    const a = await app.inject({
      method: 'POST',
      url: `/api/v1/companies/${companyId}/company-leads`,
      headers: { cookie, 'content-type': 'application/json' },
      payload: { userId: leadAId },
    });
    expect(a.statusCode).toBe(201);

    const b = await app.inject({
      method: 'POST',
      url: `/api/v1/companies/${companyId}/company-leads`,
      headers: { cookie, 'content-type': 'application/json' },
      payload: { userId: leadBId },
    });
    expect(b.statusCode).toBe(201);
    expect(await prisma.companyLead.count({ where: { companyId } })).toBe(2);
  });
});
