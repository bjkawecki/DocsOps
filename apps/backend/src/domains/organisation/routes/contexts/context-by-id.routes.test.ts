import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../../../app.js';
import { prisma } from '../../../../db.js';
import { hashPassword } from '../../../auth/services/password.js';
import { findOrCreateOwner } from '../../services/contexts/owner.service.js';

const TS = `ctx-by-id-${Date.now()}`;
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

describe('GET /api/v1/contexts/:contextId', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let companyId: string;
  let leadId: string;
  let outsiderId: string;
  let processContextId: string;
  let processEntityId: string;

  beforeAll(async () => {
    app = await buildApp();
    const pw = await hashPassword(PASSWORD);
    const [company, lead, outsider] = await Promise.all([
      prisma.company.create({ data: { name: `Ctx Co ${TS}` } }),
      prisma.user.create({
        data: { name: 'Lead', email: `lead-${TS}@test.de`, passwordHash: pw },
      }),
      prisma.user.create({
        data: { name: 'Out', email: `out-${TS}@test.de`, passwordHash: pw },
      }),
    ]);
    companyId = company.id;
    leadId = lead.id;
    outsiderId = outsider.id;
    await prisma.companyLead.create({ data: { companyId, userId: leadId } });

    const owner = await findOrCreateOwner(prisma, { companyId });
    const context = await prisma.context.create({
      data: { contextType: 'process', displayName: `Proc ${TS}` },
    });
    processContextId = context.id;
    const process = await prisma.process.create({
      data: { name: `Proc ${TS}`, contextId: context.id, ownerId: owner.id },
    });
    processEntityId = process.id;
  });

  afterAll(async () => {
    await prisma.process.deleteMany({ where: { id: processEntityId } });
    await prisma.context.deleteMany({ where: { id: processContextId } });
    await prisma.companyLead.deleteMany({ where: { companyId } });
    await prisma.owner.deleteMany({ where: { companyId } });
    await prisma.company.deleteMany({ where: { id: companyId } });
    await prisma.session.deleteMany({ where: { userId: { in: [leadId, outsiderId] } } });
    await prisma.user.deleteMany({ where: { id: { in: [leadId, outsiderId] } } });
    await app.close();
  });

  it('ohne Auth → 401', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/contexts/${processContextId}`,
    });
    expect(res.statusCode).toBe(401);
  });

  it('als Company-Lead → 200 mit process payload', async () => {
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: `lead-${TS}@test.de`, password: PASSWORD },
    });
    const cookie = cookieFrom(loginRes.headers['set-cookie']);
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/contexts/${processContextId}`,
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      id: string;
      contextType: string;
      name: string;
      entityId: string;
      canWriteContext: boolean;
    };
    expect(body.id).toBe(processContextId);
    expect(body.contextType).toBe('process');
    expect(body.entityId).toBe(processEntityId);
    expect(body.name).toBe(`Proc ${TS}`);
    expect(body.canWriteContext).toBe(true);
  });

  it('ohne Leserecht → 403', async () => {
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: `out-${TS}@test.de`, password: PASSWORD },
    });
    const cookie = cookieFrom(loginRes.headers['set-cookie']);
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/contexts/${processContextId}`,
      headers: { cookie },
    });
    expect(res.statusCode).toBe(403);
  });
});
