import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../../app.js';
import { prisma } from '../../../db.js';
import { hashPassword } from '../../auth/services/password.js';

const TEST_EMAIL = `me-test-${Date.now()}@example.com`;
const TEST_PASSWORD = 'testpass';

function getCookieHeader(res: { headers: Record<string, unknown> }): string {
  const setCookie = res.headers['set-cookie'];
  if (Array.isArray(setCookie)) return setCookie.join('; ');
  if (typeof setCookie === 'string') return setCookie;
  return '';
}

describe('Me routes (GET/PATCH /me, storage, drafts)', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let testUserId: string;

  beforeAll(async () => {
    app = await buildApp();
    const passwordHash = await hashPassword(TEST_PASSWORD);
    const user = await prisma.user.create({
      data: {
        name: 'Me Test User',
        email: TEST_EMAIL,
        passwordHash,
      },
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    if (testUserId) {
      await prisma.session.deleteMany({ where: { userId: testUserId } });
      await prisma.user.deleteMany({ where: { id: testUserId } });
    }
    await app.close();
  });

  it('GET /api/v1/me ohne Cookie -> 401', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/me' });
    expect(res.statusCode).toBe(401);
  });

  it('GET /api/v1/me mit Session -> 200 + user, identity, preferences', async () => {
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });
    expect(loginRes.statusCode).toBe(204);
    const cookie = getCookieHeader(loginRes);

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/me',
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      user: { id: string; name: string; email: string };
      identity: { teams: unknown[]; departments: unknown[] };
      preferences: unknown;
    };
    expect(body.user.id).toBe(testUserId);
    expect(body.user.name).toBe('Me Test User');
    expect(body.user.email).toBe(TEST_EMAIL);
    expect(body.identity).toBeDefined();
    expect(Array.isArray(body.identity.teams)).toBe(true);
    expect(Array.isArray(body.identity.departments)).toBe(true);
    expect(body.preferences).toBeDefined();
    expect((body as { capabilities?: { healthCheck?: boolean } }).capabilities?.healthCheck).toBe(
      false
    );
  });

  it('GET /api/v1/me includes team lead-only assignment in identity.teams', async () => {
    const TS = Date.now();
    const pw = await hashPassword(TEST_PASSWORD);
    const company = await prisma.company.create({ data: { name: `Me Lead Co ${TS}` } });
    const department = await prisma.department.create({
      data: { name: `Me Lead Dept ${TS}`, companyId: company.id },
    });
    const team = await prisma.team.create({
      data: { name: `Me Lead Team ${TS}`, departmentId: department.id },
    });
    const leadOnly = await prisma.user.create({
      data: { name: 'Lead Only', email: `lead-only-${TS}@test.de`, passwordHash: pw },
    });
    await prisma.teamLead.create({ data: { teamId: team.id, userId: leadOnly.id } });

    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: `lead-only-${TS}@test.de`, password: TEST_PASSWORD },
    });
    expect(loginRes.statusCode).toBe(204);
    const cookie = getCookieHeader(loginRes);

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/me',
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      identity: {
        teams: Array<{ teamId: string; role: string }>;
      };
    };
    expect(body.identity.teams).toHaveLength(1);
    expect(body.identity.teams[0].teamId).toBe(team.id);
    expect(body.identity.teams[0].role).toBe('leader');
    expect((body as { capabilities: { healthCheck: boolean } }).capabilities.healthCheck).toBe(
      true
    );

    await prisma.teamLead.deleteMany({ where: { userId: leadOnly.id } });
    await prisma.team.delete({ where: { id: team.id } });
    await prisma.department.delete({ where: { id: department.id } });
    await prisma.company.delete({ where: { id: company.id } });
    await prisma.session.deleteMany({ where: { userId: leadOnly.id } });
    await prisma.user.delete({ where: { id: leadOnly.id } });
  });

  it('GET /api/v1/me includes companyAuthors in identity', async () => {
    const TS = Date.now();
    const pw = await hashPassword(TEST_PASSWORD);
    const company = await prisma.company.create({ data: { name: `Me Co Author Co ${TS}` } });
    const author = await prisma.user.create({
      data: { name: 'Co Author', email: `co-author-${TS}@test.de`, passwordHash: pw },
    });
    await prisma.companyAuthor.create({ data: { companyId: company.id, userId: author.id } });

    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: `co-author-${TS}@test.de`, password: TEST_PASSWORD },
    });
    expect(loginRes.statusCode).toBe(204);
    const cookie = getCookieHeader(loginRes);

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/me',
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      identity: { companyAuthors: Array<{ id: string; name: string }>; teams: unknown[] };
    };
    expect(body.identity.teams).toHaveLength(0);
    expect(body.identity.companyAuthors).toEqual([{ id: company.id, name: company.name }]);

    await prisma.companyAuthor.deleteMany({ where: { userId: author.id } });
    await prisma.company.delete({ where: { id: company.id } });
    await prisma.session.deleteMany({ where: { userId: author.id } });
    await prisma.user.delete({ where: { id: author.id } });
  });

  it('PATCH /api/v1/me -> Name aktualisiert', async () => {
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });
    const cookie = getCookieHeader(loginRes);

    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/me',
      headers: { cookie },
      payload: { name: 'Me Test User Updated' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { name: string };
    expect(body.name).toBe('Me Test User Updated');

    const updated = await prisma.user.findUniqueOrThrow({ where: { id: testUserId } });
    expect(updated.name).toBe('Me Test User Updated');
  });

  it('GET /api/v1/me/storage (personal) -> 200 mit usedBytes und attachmentCount', async () => {
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });
    const cookie = getCookieHeader(loginRes);

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/me/storage',
      headers: { cookie },
    });
    if (res.statusCode !== 200) {
      const payload = res.payload ? String(res.payload).slice(0, 500) : '';
      throw new Error(`Expected 200, got ${res.statusCode}. Body: ${payload}`);
    }
    const body = res.json() as { usedBytes: number; attachmentCount: number };
    expect(typeof body.usedBytes).toBe('number');
    expect(body.usedBytes).toBe(0);
    expect(typeof body.attachmentCount).toBe('number');
    expect(body.attachmentCount).toBe(0);
  });

  it('GET /api/v1/me/drafts ohne Cookie -> 401', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/me/drafts' });
    expect(res.statusCode).toBe(401);
  });

  it('GET /api/v1/me/drafts mit Session und scope=personal -> 200 + draftDocuments', async () => {
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });
    const cookie = getCookieHeader(loginRes);

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/me/drafts?scope=personal&limit=20&offset=0',
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      draftDocuments: unknown[];
      limit: number;
      offset: number;
    };
    expect(Array.isArray(body.draftDocuments)).toBe(true);
    expect(body.limit).toBe(20);
    expect(body.offset).toBe(0);
  });
});
