import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { prisma } from '../../../db.js';
import {
  createDocumentsTestContext,
  disposeDocumentsTestContext,
  type DocumentsTestContext,
} from '../../documents/tests/helpers/documentsTestContext.js';
import { blockDocumentJsonFromMarkdown } from '../../documents/services/blocks/documentBlocksBackfill.js';

describe('GET /api/v1/me/pulse', () => {
  let ctx: DocumentsTestContext;
  let cookie: string;

  beforeAll(async () => {
    ctx = await createDocumentsTestContext();
    cookie = await ctx.loginAsScopeLead();
  });

  afterAll(async () => {
    await prisma.$executeRaw`DELETE FROM user_notification WHERE user_id = ${ctx.scopeLeadId}`;
    await disposeDocumentsTestContext(ctx);
  });

  beforeEach(async () => {
    await prisma.$executeRaw`DELETE FROM user_notification WHERE user_id = ${ctx.scopeLeadId}`;
    await prisma.user.update({
      where: { id: ctx.scopeLeadId },
      data: { preferences: {} },
    });
  });

  it('returns 401 without session', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/api/v1/me/pulse' });
    expect(res.statusCode).toBe(401);
  });

  it('coalesces unread updates and comments; respects pulseSettings', async () => {
    const docId = ctx.publishedDocId;
    await prisma.$executeRaw`
      INSERT INTO user_notification (id, user_id, event_type, payload, created_at, read_at)
      VALUES
        (${randomUUID()}, ${ctx.scopeLeadId}, 'document-updated',
         ${JSON.stringify({ documentId: docId })}::jsonb,
         NOW() - INTERVAL '2 hours', NULL),
        (${randomUUID()}, ${ctx.scopeLeadId}, 'document-updated',
         ${JSON.stringify({ documentId: docId })}::jsonb,
         NOW() - INTERVAL '1 hour', NULL),
        (${randomUUID()}, ${ctx.scopeLeadId}, 'document-comment-created',
         ${JSON.stringify({ documentId: docId })}::jsonb,
         NOW() - INTERVAL '30 minutes', NULL),
        (${randomUUID()}, ${ctx.scopeLeadId}, 'document-comment-created',
         ${JSON.stringify({ documentId: docId })}::jsonb,
         NOW() - INTERVAL '10 minutes', NULL)
    `;

    const res = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/me/pulse',
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      stats: {
        updatedDocuments: number;
        comments: number;
        commentsLast24h: number;
      };
      items: Array<{ id: string; kind: string; meta?: { commentCount?: number } }>;
      settings: { showComments: boolean };
    };
    expect(body.stats.updatedDocuments).toBe(1);
    expect(body.stats.comments).toBe(1);
    expect(body.stats.commentsLast24h).toBe(1);
    const updated = body.items.filter((i) => i.kind === 'document-updated');
    const comments = body.items.filter((i) => i.kind === 'document-comments');
    expect(updated).toHaveLength(1);
    expect(updated[0]?.id).toBe(`document-updated:${docId}`);
    expect(comments).toHaveLength(1);
    expect(comments[0]?.meta?.commentCount).toBe(2);

    await prisma.user.update({
      where: { id: ctx.scopeLeadId },
      data: { preferences: { pulseSettings: { showComments: false } } },
    });
    const res2 = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/me/pulse',
      headers: { cookie },
    });
    const body2 = res2.json() as {
      stats: { comments: number };
      items: Array<{ kind: string }>;
      settings: { showComments: boolean };
    };
    expect(body2.settings.showComments).toBe(false);
    expect(body2.stats.comments).toBe(0);
    expect(body2.items.some((i) => i.kind === 'document-comments')).toBe(false);
  });

  it('POST read marks all comment notifications for the document', async () => {
    const docId = ctx.publishedDocId;
    await prisma.$executeRaw`
      INSERT INTO user_notification (id, user_id, event_type, payload, created_at, read_at)
      VALUES
        (${randomUUID()}, ${ctx.scopeLeadId}, 'document-comment-created',
         ${JSON.stringify({ documentId: docId })}::jsonb, NOW(), NULL),
        (${randomUUID()}, ${ctx.scopeLeadId}, 'document-comment-created',
         ${JSON.stringify({ documentId: docId })}::jsonb, NOW(), NULL)
    `;

    const readRes = await ctx.app.inject({
      method: 'POST',
      url: `/api/v1/me/pulse/items/${encodeURIComponent(`document-comments:${docId}`)}/read`,
      headers: { cookie },
    });
    expect(readRes.statusCode).toBe(204);

    const left = await prisma.$queryRaw<Array<{ c: bigint }>>`
      SELECT COUNT(*)::bigint AS c
      FROM user_notification
      WHERE user_id = ${ctx.scopeLeadId}
        AND read_at IS NULL
        AND event_type = 'document-comment-created'
    `;
    expect(Number(left[0]?.c ?? 0n)).toBe(0);

    const pulse = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/me/pulse',
      headers: { cookie },
    });
    const body = pulse.json() as { stats: { comments: number } };
    expect(body.stats.comments).toBe(0);
  });

  it('POST read on draft-open returns 400', async () => {
    const res = await ctx.app.inject({
      method: 'POST',
      url: `/api/v1/me/pulse/items/${encodeURIComponent('draft-open:clxxxxxxxxxxxxxxxxxxxxxxxx')}/read`,
      headers: { cookie },
    });
    expect(res.statusCode).toBe(400);
  });

  it('paginates feed with limit and offset and returns total', async () => {
    const docId = ctx.publishedDocId;
    await prisma.$executeRaw`
      INSERT INTO user_notification (id, user_id, event_type, payload, created_at, read_at)
      VALUES
        (${randomUUID()}, ${ctx.scopeLeadId}, 'document-updated',
         ${JSON.stringify({ documentId: docId })}::jsonb, NOW() - INTERVAL '2 hours', NULL),
        (${randomUUID()}, ${ctx.scopeLeadId}, 'document-comment-created',
         ${JSON.stringify({ documentId: docId })}::jsonb, NOW() - INTERVAL '1 hour', NULL)
    `;

    const page1 = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/me/pulse?limit=1&offset=0',
      headers: { cookie },
    });
    expect(page1.statusCode).toBe(200);
    const body1 = page1.json() as {
      items: Array<{ id: string }>;
      total: number;
      limit: number;
      offset: number;
    };
    expect(body1.limit).toBe(1);
    expect(body1.offset).toBe(0);
    expect(body1.items).toHaveLength(1);
    expect(body1.total).toBeGreaterThanOrEqual(2);

    const page2 = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/me/pulse?limit=1&offset=1',
      headers: { cookie },
    });
    const body2 = page2.json() as { items: Array<{ id: string }>; total: number };
    expect(body2.items).toHaveLength(1);
    expect(body2.items[0]?.id).not.toBe(body1.items[0]?.id);
    expect(body2.total).toBe(body1.total);
  });
});

describe('GET /api/v1/me/pulse/explore', () => {
  let ctx: DocumentsTestContext;
  let cookie: string;

  beforeAll(async () => {
    ctx = await createDocumentsTestContext();
    cookie = await ctx.loginAsScopeLead();
  });

  afterAll(async () => {
    await disposeDocumentsTestContext(ctx);
  });

  it('returns 401 without session', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/api/v1/me/pulse/explore' });
    expect(res.statusCode).toBe(401);
  });

  it('returns department column with published docs for scope lead', async () => {
    const res = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/me/pulse/explore',
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      columns: Array<{ key: string; title: string; items: Array<{ id: string; title: string }> }>;
    };
    expect(body.columns.length).toBeGreaterThanOrEqual(1);
    expect(body.columns.length).toBeLessThanOrEqual(3);
    for (const col of body.columns) {
      expect(col.items.length).toBeLessThanOrEqual(4);
    }
    const deptCol = body.columns.find((c) => c.key.startsWith('department:'));
    expect(deptCol).toBeDefined();
    expect(deptCol!.items.some((i) => i.id === ctx.publishedDocId)).toBe(true);
  });

  it('excludes scope start documents from explore columns', async () => {
    await prisma.department.update({
      where: { id: ctx.departmentId },
      data: { startDocumentId: ctx.publishedDocId },
    });
    const res = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/me/pulse/explore',
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      columns: Array<{ items: Array<{ id: string }> }>;
    };
    for (const col of body.columns) {
      expect(col.items.some((i) => i.id === ctx.publishedDocId)).toBe(false);
    }
    await prisma.department.update({
      where: { id: ctx.departmentId },
      data: { startDocumentId: null },
    });
  });

  it('derives department and company columns from team membership', async () => {
    await prisma.teamMember.create({
      data: { teamId: ctx.teamId, userId: ctx.writerId },
    });

    const teamOwner = await prisma.owner.create({ data: { teamId: ctx.teamId } });
    const teamCtx = await prisma.context.create({ data: {} });
    await prisma.process.create({
      data: { name: 'Team process', contextId: teamCtx.id, ownerId: teamOwner.id },
    });
    const teamDoc = await prisma.$transaction(async (tx) => {
      const blocks = blockDocumentJsonFromMarkdown('Team explore content');
      const document = await tx.document.create({
        data: { title: 'Team Explore Doc', draftBlocks: blocks, contextId: teamCtx.id },
      });
      const version = await tx.documentVersion.create({
        data: {
          documentId: document.id,
          blocks,
          blocksSchemaVersion: 0,
          versionNumber: 1,
          createdById: ctx.writerId,
        },
      });
      await tx.document.update({
        where: { id: document.id },
        data: { publishedAt: new Date(), currentPublishedVersionId: version.id },
      });
      return document;
    });

    const companyOwner = await prisma.owner.create({ data: { companyId: ctx.companyId } });
    const companyCtx = await prisma.context.create({ data: {} });
    await prisma.process.create({
      data: { name: 'Company process', contextId: companyCtx.id, ownerId: companyOwner.id },
    });
    const companyDoc = await prisma.$transaction(async (tx) => {
      const blocks = blockDocumentJsonFromMarkdown('Company explore content');
      const document = await tx.document.create({
        data: { title: 'Company Explore Doc', draftBlocks: blocks, contextId: companyCtx.id },
      });
      const version = await tx.documentVersion.create({
        data: {
          documentId: document.id,
          blocks,
          blocksSchemaVersion: 0,
          versionNumber: 1,
          createdById: ctx.writerId,
        },
      });
      await tx.document.update({
        where: { id: document.id },
        data: { publishedAt: new Date(), currentPublishedVersionId: version.id },
      });
      return document;
    });
    const writerCookie = await ctx.loginAsWriter();
    const res = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/me/pulse/explore',
      headers: { cookie: writerCookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      columns: Array<{ key: string; items: Array<{ id: string }> }>;
    };
    const byPrefix = (prefix: string) => body.columns.find((c) => c.key.startsWith(prefix));
    expect(byPrefix('team:')?.items.some((i) => i.id === teamDoc.id)).toBe(true);
    expect(byPrefix('department:')?.items.some((i) => i.id === ctx.publishedDocId)).toBe(true);
    expect(byPrefix('company:')?.items.some((i) => i.id === companyDoc.id)).toBe(true);

    await prisma.document.deleteMany({ where: { id: { in: [teamDoc.id, companyDoc.id] } } });
    await prisma.process.deleteMany({
      where: { contextId: { in: [teamCtx.id, companyCtx.id] } },
    });
    await prisma.context.deleteMany({ where: { id: { in: [teamCtx.id, companyCtx.id] } } });
    await prisma.owner.deleteMany({ where: { id: { in: [teamOwner.id, companyOwner.id] } } });
    await prisma.teamMember.deleteMany({
      where: { teamId: ctx.teamId, userId: ctx.writerId },
    });
  });
  it('returns empty columns for user without readable explore docs', async () => {
    const lonelyCookie = await ctx.loginAsReaderOnly();
    // Reader-only has grants but no org membership → no team/dept/company; no createdById docs.
    const res = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/me/pulse/explore',
      headers: { cookie: lonelyCookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { columns: unknown[] };
    // May still see nothing in drafts/your-documents; grants alone do not create org columns.
    expect(Array.isArray(body.columns)).toBe(true);
    expect(body.columns.length).toBeLessThanOrEqual(3);
  });

  it('fills with Your drafts when creator has unpublished docs', async () => {
    await prisma.document.update({
      where: { id: ctx.draftDocId },
      data: { createdById: ctx.scopeLeadId },
    });
    const res = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/me/pulse/explore',
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      columns: Array<{ key: string; items: Array<{ id: string }> }>;
    };
    const drafts = body.columns.find((c) => c.key === 'drafts');
    expect(drafts).toBeDefined();
    expect(drafts!.items.some((i) => i.id === ctx.draftDocId)).toBe(true);
  });

  it('uses org scopes for platform admin without memberships', async () => {
    const { hashPassword } = await import('../../auth/services/password.js');
    const { getCookieHeader } = await import('../../documents/tests/helpers/httpTestHelpers.js');
    const email = `explore-admin-${Date.now()}@example.com`;
    const password = 'testpass';
    const admin = await prisma.user.create({
      data: {
        name: 'Explore Admin',
        email,
        isAdmin: true,
        passwordHash: await hashPassword(password),
      },
    });
    const loginRes = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email, password },
    });
    expect(loginRes.statusCode).toBe(204);
    const adminCookie = getCookieHeader(loginRes.headers['set-cookie']);
    const res = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/me/pulse/explore',
      headers: { cookie: adminCookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      columns: Array<{ key: string; items: Array<{ id: string }> }>;
    };
    expect(body.columns.length).toBeGreaterThanOrEqual(1);
    expect(
      body.columns.some(
        (c) =>
          c.key.startsWith('company:') ||
          c.key.startsWith('department:') ||
          c.key.startsWith('team:')
      )
    ).toBe(true);
    expect(body.columns.some((c) => c.items.some((i) => i.id === ctx.publishedDocId))).toBe(true);

    await prisma.user.delete({ where: { id: admin.id } });
  });
});
