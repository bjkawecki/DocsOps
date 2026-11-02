import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../../app.js';
import { prisma } from '../../../db.js';
import { hashPassword } from '../../auth/services/password.js';
import { emptyBlockDocumentJson } from '../../documents/services/blocks/documentBlocksBackfill.js';

const TEST_PASSWORD = 'testpass';

function getCookieHeader(res: { headers: Record<string, unknown> }): string {
  const setCookie = res.headers['set-cookie'];
  if (Array.isArray(setCookie)) return setCookie.join('; ');
  if (typeof setCookie === 'string') return setCookie;
  return '';
}

const TEST_EMAIL_ORG = `trash-archive-org-${Date.now()}@example.com`;

describe('GET /me/trash and /me/archive (org scope)', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let testUserId: string;
  let companyId: string;
  let ownerId: string;
  let contextId: string;
  let processId: string;
  let docTrashId: string;
  let docArchiveId: string;

  beforeAll(async () => {
    app = await buildApp();
    const passwordHash = await hashPassword(TEST_PASSWORD);
    const user = await prisma.user.create({
      data: {
        name: 'Trash Archive Org Test User',
        email: TEST_EMAIL_ORG,
        passwordHash,
      },
    });
    testUserId = user.id;

    const company = await prisma.company.create({
      data: { name: `TrashArchive Company ${Date.now()}` },
    });
    companyId = company.id;
    const owner = await prisma.owner.create({
      data: { companyId },
    });
    ownerId = owner.id;
    const context = await prisma.context.create({
      data: { contextType: 'process' },
    });
    contextId = context.id;
    const process = await prisma.process.create({
      data: {
        name: 'TrashArchive Process',
        contextId,
        ownerId,
      },
    });
    processId = process.id;
    const docTrash = await prisma.document.create({
      data: {
        title: 'Doc for Trash',
        draftBlocks: emptyBlockDocumentJson(),
        contextId,
        createdById: testUserId,
      },
    });
    docTrashId = docTrash.id;
    const docArchive = await prisma.document.create({
      data: {
        title: 'Doc for Archive',
        draftBlocks: emptyBlockDocumentJson(),
        contextId,
        createdById: testUserId,
      },
    });
    docArchiveId = docArchive.id;
    await prisma.companyLead.create({
      data: { companyId, userId: testUserId },
    });
  });

  afterAll(async () => {
    if (docTrashId) await prisma.document.deleteMany({ where: { id: docTrashId } });
    if (docArchiveId) await prisma.document.deleteMany({ where: { id: docArchiveId } });
    if (processId) await prisma.process.deleteMany({ where: { id: processId } });
    if (contextId) await prisma.context.deleteMany({ where: { id: contextId } });
    if (ownerId) await prisma.owner.deleteMany({ where: { id: ownerId } });
    if (companyId) {
      await prisma.companyLead.deleteMany({ where: { companyId } });
      await prisma.company.deleteMany({ where: { id: companyId } });
    }
    if (testUserId) {
      await prisma.session.deleteMany({ where: { userId: testUserId } });
      await prisma.user.deleteMany({ where: { id: testUserId } });
    }
    await app.close();
  });

  it('GET /me/trash?scope=company&companyId=... as company lead returns trashed document', async () => {
    await prisma.document.update({
      where: { id: docTrashId },
      data: { deletedAt: new Date() },
    });
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: TEST_EMAIL_ORG, password: TEST_PASSWORD },
    });
    expect(loginRes.statusCode).toBe(204);
    const cookie = getCookieHeader(loginRes);

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/me/trash?scope=company&companyId=${companyId}&limit=20&offset=0`,
      headers: { cookie },
    });
    if (res.statusCode !== 200) {
      const body = res.json() as { message?: string; error?: string; statusCode?: number };
      throw new Error(`Expected 200, got ${res.statusCode}: ${JSON.stringify(body)}`);
    }
    const body = res.json() as { items: { type: string; id: string }[]; total: number };
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.total).toBeGreaterThanOrEqual(1);
    const docItem = body.items.find((i) => i.type === 'document' && i.id === docTrashId);
    expect(docItem).toBeDefined();
    expect(docItem?.id).toBe(docTrashId);
  });

  it('GET /me/archive?scope=company&companyId=... as company lead returns archived document', async () => {
    await prisma.document.update({
      where: { id: docArchiveId },
      data: { archivedAt: new Date(), deletedAt: null },
    });
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: TEST_EMAIL_ORG, password: TEST_PASSWORD },
    });
    expect(loginRes.statusCode).toBe(204);
    const cookie = getCookieHeader(loginRes);

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/me/archive?scope=company&companyId=${companyId}&limit=20&offset=0`,
      headers: { cookie },
    });
    if (res.statusCode !== 200) {
      const body = res.json() as { message?: string; error?: string; statusCode?: number };
      throw new Error(`Expected 200, got ${res.statusCode}: ${JSON.stringify(body)}`);
    }
    const body = res.json() as { items: { type: string; id: string }[]; total: number };
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.total).toBeGreaterThanOrEqual(1);
    const docItem = body.items.find((i) => i.type === 'document' && i.id === docArchiveId);
    expect(docItem).toBeDefined();
    expect(docItem?.id).toBe(docArchiveId);
  });
});
