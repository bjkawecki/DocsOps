import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { GrantRole } from '../../../../generated/prisma/client.js';
import { prisma } from '../../../db.js';
import { hashPassword } from '../../auth/services/password.js';
import { blockDocumentJsonFromMarkdown } from '../../documents/services/blocks/documentBlocksBackfill.js';
import { getCookieHeader } from '../../documents/tests/helpers/httpTestHelpers.js';
import {
  createDocumentsTestContext,
  disposeDocumentsTestContext,
  type DocumentsTestContext,
} from '../../documents/tests/helpers/documentsTestContext.js';

describe('GET /api/v1/me/most-read', () => {
  let ctx: DocumentsTestContext;
  let popularDocId: string;
  let zeroViewDocId: string;
  let draftDocId: string;
  let memberCookie: string;
  let memberId: string;

  beforeAll(async () => {
    ctx = await createDocumentsTestContext();

    const popular = await prisma.$transaction(async (tx) => {
      const blocks = blockDocumentJsonFromMarkdown('Popular content');
      const document = await tx.document.create({
        data: {
          title: 'Most Read Doc',
          draftBlocks: blocks,
          contextId: ctx.contextId,
          viewCount: 12,
        },
      });
      const version = await tx.documentVersion.create({
        data: {
          documentId: document.id,
          blocks,
          blocksSchemaVersion: 0,
          versionNumber: 1,
          createdById: ctx.scopeLeadId,
        },
      });
      await tx.document.update({
        where: { id: document.id },
        data: {
          publishedAt: new Date('2020-01-01T00:00:00.000Z'),
          currentPublishedVersionId: version.id,
        },
      });
      return document;
    });
    popularDocId = popular.id;

    const zero = await prisma.$transaction(async (tx) => {
      const blocks = blockDocumentJsonFromMarkdown('Zero views');
      const document = await tx.document.create({
        data: {
          title: 'Zero View Doc',
          draftBlocks: blocks,
          contextId: ctx.contextId,
          viewCount: 0,
        },
      });
      const version = await tx.documentVersion.create({
        data: {
          documentId: document.id,
          blocks,
          blocksSchemaVersion: 0,
          versionNumber: 1,
          createdById: ctx.scopeLeadId,
        },
      });
      await tx.document.update({
        where: { id: document.id },
        data: {
          publishedAt: new Date('2026-08-01T00:00:00.000Z'),
          currentPublishedVersionId: version.id,
        },
      });
      return document;
    });
    zeroViewDocId = zero.id;

    const draft = await prisma.document.create({
      data: {
        title: 'Draft with views',
        draftBlocks: blockDocumentJsonFromMarkdown('Draft'),
        contextId: ctx.contextId,
        viewCount: 99,
      },
    });
    draftDocId = draft.id;

    const passwordHash = await hashPassword('testpass');
    const member = await prisma.user.create({
      data: {
        name: 'Most Read Member',
        email: `most-read-member-${Date.now()}@example.com`,
        passwordHash,
      },
    });
    memberId = member.id;
    await prisma.teamMember.create({
      data: { teamId: ctx.teamId, userId: member.id },
    });
    await prisma.documentGrantUser.create({
      data: {
        documentId: popularDocId,
        userId: member.id,
        role: GrantRole.Read,
      },
    });
    const loginRes = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: member.email, password: 'testpass' },
    });
    expect(loginRes.statusCode).toBe(204);
    memberCookie = getCookieHeader(loginRes.headers['set-cookie']);
  });

  afterAll(async () => {
    await prisma.document.deleteMany({
      where: { id: { in: [popularDocId, zeroViewDocId, draftDocId] } },
    });
    if (memberId) {
      await prisma.teamMember.deleteMany({ where: { userId: memberId } });
      await prisma.documentGrantUser.deleteMany({ where: { userId: memberId } });
      await prisma.session.deleteMany({ where: { userId: memberId } });
      await prisma.user.deleteMany({ where: { id: memberId } });
    }
    await disposeDocumentsTestContext(ctx);
  });

  it('returns 401 without session', async () => {
    const res = await ctx.app.inject({
      method: 'GET',
      url: `/api/v1/me/most-read?scope=department&departmentId=${ctx.departmentId}`,
    });
    expect(res.statusCode).toBe(401);
  });

  it('scope lead gets docs ordered by viewCount; excludes zero and drafts', async () => {
    const cookie = await ctx.loginAsScopeLead();
    const res = await ctx.app.inject({
      method: 'GET',
      url: `/api/v1/me/most-read?scope=department&departmentId=${ctx.departmentId}`,
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      items: Array<{ id: string; title: string; viewCount: number; contextName: string }>;
    };
    expect(body.items.some((i) => i.id === popularDocId)).toBe(true);
    expect(body.items.find((i) => i.id === popularDocId)?.viewCount).toBe(12);
    expect(body.items.some((i) => i.id === zeroViewDocId)).toBe(false);
    expect(body.items.some((i) => i.id === draftDocId)).toBe(false);
    const counts = body.items.map((i) => i.viewCount);
    expect(counts).toEqual([...counts].sort((a, b) => b - a));
  });

  it('non-lead member gets empty items', async () => {
    const res = await ctx.app.inject({
      method: 'GET',
      url: `/api/v1/me/most-read?scope=department&departmentId=${ctx.departmentId}`,
      headers: { cookie: memberCookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { items: unknown[] };
    expect(body.items).toEqual([]);
  });

  it('personal owner sees own published docs with views', async () => {
    const passwordHash = await hashPassword('testpass');
    const email = `most-read-personal-${Date.now()}@example.com`;
    const owner = await prisma.user.create({
      data: { name: 'Personal Owner', email, passwordHash },
    });
    const ownerRow = await prisma.owner.create({ data: { ownerUserId: owner.id } });
    const context = await prisma.context.create({ data: {} });
    await prisma.process.create({
      data: { name: 'Personal process', contextId: context.id, ownerId: ownerRow.id },
    });
    const personalDoc = await prisma.$transaction(async (tx) => {
      const blocks = blockDocumentJsonFromMarkdown('Personal popular');
      const document = await tx.document.create({
        data: {
          title: 'Personal Most Read',
          draftBlocks: blocks,
          contextId: context.id,
          viewCount: 3,
        },
      });
      const version = await tx.documentVersion.create({
        data: {
          documentId: document.id,
          blocks,
          blocksSchemaVersion: 0,
          versionNumber: 1,
          createdById: owner.id,
        },
      });
      await tx.document.update({
        where: { id: document.id },
        data: {
          publishedAt: new Date(),
          currentPublishedVersionId: version.id,
        },
      });
      return document;
    });

    const loginRes = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email, password: 'testpass' },
    });
    expect(loginRes.statusCode).toBe(204);
    const cookie = getCookieHeader(loginRes.headers['set-cookie']);
    const res = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/me/most-read?scope=personal',
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { items: Array<{ id: string }> };
    expect(body.items.some((i) => i.id === personalDoc.id)).toBe(true);

    await prisma.document.deleteMany({ where: { id: personalDoc.id } });
    await prisma.process.deleteMany({ where: { contextId: context.id } });
    await prisma.context.deleteMany({ where: { id: context.id } });
    await prisma.owner.deleteMany({ where: { id: ownerRow.id } });
    await prisma.session.deleteMany({ where: { userId: owner.id } });
    await prisma.user.deleteMany({ where: { id: owner.id } });
  });
});
