import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../../../app.js';
import { prisma } from '../../../../db.js';
import { hashPassword } from '../../../auth/services/password.js';
import { findOrCreateOwner } from '../../services/contexts/owner.service.js';

const TS = `scope-pdf-${Date.now()}`;
const PASSWORD = 'testpass';

function cookieFrom(setCookie: string | string[] | undefined): string {
  if (Array.isArray(setCookie))
    return setCookie
      .map((s) => (typeof s === 'string' ? s.split(';')[0].trim() : ''))
      .filter(Boolean)
      .join('; ');
  if (typeof setCookie === 'string') return setCookie.split(';')[0].trim();
  return '';
}

describe('POST /api/v1/contexts/:contextId/pdf-export', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let companyId: string;
  let leadId: string;
  let memberId: string;
  let personalUserId: string;
  let orgContextId: string;
  let personalContextId: string;
  let processEntityId: string;
  let personalProcessId: string;

  beforeAll(async () => {
    app = await buildApp();
    const pw = await hashPassword(PASSWORD);
    const [company, lead, member, personalUser] = await Promise.all([
      prisma.company.create({ data: { name: `Scope PDF Co ${TS}` } }),
      prisma.user.create({
        data: { name: 'Lead', email: `lead-${TS}@test.de`, passwordHash: pw },
      }),
      prisma.user.create({
        data: { name: 'Member', email: `member-${TS}@test.de`, passwordHash: pw },
      }),
      prisma.user.create({
        data: { name: 'Personal', email: `personal-${TS}@test.de`, passwordHash: pw },
      }),
    ]);
    companyId = company.id;
    leadId = lead.id;
    memberId = member.id;
    personalUserId = personalUser.id;
    await prisma.companyLead.create({ data: { companyId, userId: leadId } });

    const orgOwner = await findOrCreateOwner(prisma, { companyId });
    const orgContext = await prisma.context.create({
      data: { contextType: 'process', displayName: `Org Proc ${TS}` },
    });
    orgContextId = orgContext.id;
    const process = await prisma.process.create({
      data: { name: `Org Proc ${TS}`, contextId: orgContext.id, ownerId: orgOwner.id },
    });
    processEntityId = process.id;

    const personalOwner = await findOrCreateOwner(prisma, { ownerUserId: personalUserId });
    const personalContext = await prisma.context.create({
      data: { contextType: 'process', displayName: `Personal Proc ${TS}` },
    });
    personalContextId = personalContext.id;
    const personalProcess = await prisma.process.create({
      data: {
        name: `Personal Proc ${TS}`,
        contextId: personalContext.id,
        ownerId: personalOwner.id,
      },
    });
    personalProcessId = personalProcess.id;
  });

  afterAll(async () => {
    await prisma.scopePdfExportRun.deleteMany({
      where: { triggeredByUserId: { in: [leadId, memberId, personalUserId] } },
    });
    await prisma.process.deleteMany({
      where: { id: { in: [processEntityId, personalProcessId] } },
    });
    await prisma.context.deleteMany({ where: { id: { in: [orgContextId, personalContextId] } } });
    await prisma.companyLead.deleteMany({ where: { companyId } });
    await prisma.owner.deleteMany({
      where: { OR: [{ companyId }, { ownerUserId: personalUserId }] },
    });
    await prisma.company.deleteMany({ where: { id: companyId } });
    await prisma.session.deleteMany({
      where: { userId: { in: [leadId, memberId, personalUserId] } },
    });
    await prisma.user.deleteMany({ where: { id: { in: [leadId, memberId, personalUserId] } } });
    await app.close();
  });

  async function login(email: string): Promise<string> {
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email, password: PASSWORD },
    });
    expect([200, 204]).toContain(loginRes.statusCode);
    return cookieFrom(loginRes.headers['set-cookie']);
  }

  it('ohne Auth -> 401', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/contexts/${orgContextId}/pdf-export`,
    });
    expect(res.statusCode).toBe(401);
  });

  it('Member ohne Write -> 403', async () => {
    const cookie = await login(`member-${TS}@test.de`);
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/contexts/${orgContextId}/pdf-export`,
      headers: { cookie },
    });
    expect(res.statusCode).toBe(403);
  });

  it('persönlicher Kontext -> 400', async () => {
    const cookie = await login(`personal-${TS}@test.de`);
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/contexts/${personalContextId}/pdf-export`,
      headers: { cookie },
    });
    expect(res.statusCode).toBe(400);
  });

  it('fremder Run-Download -> 404', async () => {
    const cookie = await login(`member-${TS}@test.de`);
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/scope-pdf-exports/clxxxxxxxxxxxxxxxxxxxx/download`,
      headers: { cookie },
    });
    expect([400, 404]).toContain(res.statusCode);
  });

  it('Company-Lead startet Export -> 202 oder 503 (MinIO)', async () => {
    const cookie = await login(`lead-${TS}@test.de`);
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/contexts/${orgContextId}/pdf-export`,
      headers: { cookie },
    });
    expect([202, 503]).toContain(res.statusCode);
    if (res.statusCode === 202) {
      const body = res.json() as { runId: string };
      expect(body.runId).toBeTruthy();
      await prisma.scopePdfExportRun.deleteMany({ where: { id: body.runId } });
    }
  });
});
