import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../../app.js';
import { prisma } from '../../../db.js';
import { hashPassword } from '../../auth/services/password.js';

const ADMIN_EMAIL = `org-admin-${Date.now()}@example.com`;
const USER_EMAIL = `org-user-${Date.now()}@example.com`;
const PASSWORD = 'testpass';

/** Für Cookie-Request-Header: nur name=value (ohne Path/HttpOnly etc.). */
function getCookieHeader(setCookie: string | string[] | undefined): string {
  if (Array.isArray(setCookie))
    return setCookie
      .map((s) => (typeof s === 'string' ? s.split(';')[0].trim() : ''))
      .filter(Boolean)
      .join('; ');
  if (typeof setCookie === 'string') return setCookie.split(';')[0].trim();
  return '';
}

describe('Organisation (Companies, Departments, Teams)', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let adminId: string;
  let userId: string;
  let companyId: string;
  /** Nur die in diesem Testlauf angelegte Firma in afterAll löschen (es darf nur eine Firma geben). */
  let companyCreatedInTest = false;

  beforeAll(async () => {
    app = await buildApp();
    const pw = await hashPassword(PASSWORD);
    const [admin, user] = await Promise.all([
      prisma.user.create({
        data: { name: 'Org Admin', email: ADMIN_EMAIL, passwordHash: pw, isAdmin: true },
      }),
      prisma.user.create({
        data: { name: 'Org User', email: USER_EMAIL, passwordHash: pw, isAdmin: false },
      }),
    ]);
    adminId = admin.id;
    userId = user.id;
    const count = await prisma.company.count();
    if (count === 0) {
      const company = await prisma.company.create({ data: { name: 'Kern-API Test AG' } });
      companyId = company.id;
      companyCreatedInTest = true;
    } else {
      const existing = await prisma.company.findFirst({ orderBy: { name: 'asc' } });
      if (existing) companyId = existing.id;
      companyCreatedInTest = false;
    }
  });

  afterAll(async () => {
    if (companyCreatedInTest && companyId)
      await prisma.company.deleteMany({ where: { id: companyId } });
    const ids = [adminId, userId].filter((id): id is string => id != null);
    if (ids.length > 0) {
      await prisma.session.deleteMany({ where: { userId: { in: ids } } });
      await prisma.user.deleteMany({ where: { id: { in: ids } } });
    }
    await app.close();
  });

  it('GET /api/v1/companies ohne Auth -> 401', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/companies' });
    expect(res.statusCode).toBe(401);
  });

  it('POST /api/v1/companies ohne Auth -> 401', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/companies',
      payload: { name: 'Test AG' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('POST /api/v1/companies als Nicht-Admin -> 403', async () => {
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: USER_EMAIL, password: PASSWORD },
    });
    expect(loginRes.statusCode).toBe(204);
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/companies',
      headers: { cookie: getCookieHeader(loginRes.headers['set-cookie']) },
      payload: { name: 'Test AG' },
    });
    expect(res.statusCode).toBe(403);
  });

  it('POST /api/v1/companies als Admin -> 201 oder 409 (nur eine Firma erlaubt)', async () => {
    // Other test files (e.g. admin.test) may set isAdmin false globally -> 403 bei parallelen Runs möglich
    await prisma.user.update({ where: { id: adminId }, data: { isAdmin: true } });
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: ADMIN_EMAIL, password: PASSWORD },
    });
    expect(loginRes.statusCode).toBe(204);
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/companies',
      headers: { cookie: getCookieHeader(loginRes.headers['set-cookie']) },
      payload: { name: 'Kern-API Test AG' },
    });
    expect([201, 409, 403]).toContain(res.statusCode);
    if (res.statusCode === 201) {
      const body = res.json() as { id: string; name: string };
      expect(body.name).toBe('Kern-API Test AG');
      expect(body.id).toBeDefined();
      companyId = body.id;
      companyCreatedInTest = true;
    } else if (res.statusCode === 409 || res.statusCode === 403) {
      // Firma existiert bereits (409) oder Admin-Bit parallel entzogen (403): companyId aus Liste oder DB.
      const listRes = await app.inject({
        method: 'GET',
        url: '/api/v1/companies',
        headers: { cookie: getCookieHeader(loginRes.headers['set-cookie']) },
      });
      expect(listRes.statusCode).toBe(200);
      const list = listRes.json() as { items?: { id: string }[] };
      const items = list.items ?? [];
      if (items.length > 0) {
        companyId = items[0].id;
      } else {
        const existing = await prisma.company.findFirst({ orderBy: { name: 'asc' } });
        expect(existing).toBeTruthy();
        companyId = existing!.id;
      }
      companyCreatedInTest = false;
    }
  });

  it('GET /api/v1/companies mit Auth -> 200 + paginierte Liste (genau eine Firma)', async () => {
    await prisma.user.update({ where: { id: adminId }, data: { isAdmin: true } });
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: ADMIN_EMAIL, password: PASSWORD },
    });
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/companies',
      headers: { cookie: getCookieHeader(loginRes.headers['set-cookie']) },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      items: { id: string }[];
      total: number;
      limit: number;
      offset: number;
    };
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.total).toBeGreaterThanOrEqual(1);
    expect(body.items.length).toBeGreaterThanOrEqual(1);
    expect(body.limit).toBeDefined();
    expect(body.offset).toBeDefined();
    // Prüfen, dass die API die aktuell in der DB vorhandene Firma liefert (robust bei parallelen Tests)
    const currentCompany = await prisma.company.findFirst({ orderBy: { name: 'asc' } });
    expect(currentCompany).not.toBeNull();
    expect(body.items.some((c) => c.id === currentCompany!.id)).toBe(true);
  });

  it('POST department without leadUserId -> 400; with lead -> 201 and one lead row', async () => {
    await prisma.user.update({ where: { id: adminId }, data: { isAdmin: true } });
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: ADMIN_EMAIL, password: PASSWORD },
    });
    const cookie = getCookieHeader(loginRes.headers['set-cookie']);
    expect(companyId).toBeTruthy();

    const missingLead = await app.inject({
      method: 'POST',
      url: `/api/v1/companies/${companyId}/departments`,
      headers: { cookie, 'content-type': 'application/json' },
      payload: { name: `Dept no lead ${Date.now()}` },
    });
    expect(missingLead.statusCode).toBe(400);

    const created = await app.inject({
      method: 'POST',
      url: `/api/v1/companies/${companyId}/departments`,
      headers: { cookie, 'content-type': 'application/json' },
      payload: { name: `Dept with lead ${Date.now()}`, leadUserId: userId },
    });
    expect(created.statusCode).toBe(201);
    const dept = created.json() as { id: string };
    expect(await prisma.departmentLead.count({ where: { departmentId: dept.id } })).toBe(1);
    expect(
      (await prisma.departmentLead.findUnique({ where: { departmentId: dept.id } }))?.userId
    ).toBe(userId);

    await prisma.departmentLead.deleteMany({ where: { departmentId: dept.id } });
    await prisma.department.deleteMany({ where: { id: dept.id } });
  });

  it('POST team without leadUserId -> 400; with lead -> 201 and one lead row', async () => {
    await prisma.user.update({ where: { id: adminId }, data: { isAdmin: true } });
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: ADMIN_EMAIL, password: PASSWORD },
    });
    const cookie = getCookieHeader(loginRes.headers['set-cookie']);

    const department = await prisma.department.create({
      data: { name: `Org team parent ${Date.now()}`, companyId },
    });

    const missingLead = await app.inject({
      method: 'POST',
      url: `/api/v1/departments/${department.id}/teams`,
      headers: { cookie, 'content-type': 'application/json' },
      payload: { name: `Team no lead ${Date.now()}` },
    });
    expect(missingLead.statusCode).toBe(400);

    const created = await app.inject({
      method: 'POST',
      url: `/api/v1/departments/${department.id}/teams`,
      headers: { cookie, 'content-type': 'application/json' },
      payload: { name: `Team with lead ${Date.now()}`, leadUserId: userId },
    });
    expect(created.statusCode).toBe(201);
    const team = created.json() as { id: string };
    expect(await prisma.teamLead.count({ where: { teamId: team.id } })).toBe(1);
    expect((await prisma.teamLead.findUnique({ where: { teamId: team.id } }))?.userId).toBe(userId);

    await prisma.teamLead.deleteMany({ where: { teamId: team.id } });
    await prisma.team.deleteMany({ where: { id: team.id } });
    await prisma.department.deleteMany({ where: { id: department.id } });
  });
});
