import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '../../../db.js';
import { blockDocumentJsonFromMarkdown } from '../services/blocks/documentBlocksBackfill.js';
import {
  createDocumentsTestContext,
  disposeDocumentsTestContext,
  type DocumentsTestContext,
} from './helpers/documentsTestContext.js';

describe('Document views (GET /documents/:id)', () => {
  let ctx: DocumentsTestContext;

  beforeAll(async () => {
    ctx = await createDocumentsTestContext();
  });

  afterAll(async () => {
    await disposeDocumentsTestContext(ctx);
  });

  beforeEach(async () => {
    await prisma.documentView.deleteMany({
      where: { documentId: { in: [ctx.publishedDocId, ctx.draftDocId] } },
    });
    await prisma.document.updateMany({
      where: { id: { in: [ctx.publishedDocId, ctx.draftDocId] } },
      data: { viewCount: 0 },
    });
  });

  it('reader GET published increments viewCount once per UTC day', async () => {
    const cookie = await ctx.loginAsReaderOnly();
    const first = await ctx.app.inject({
      method: 'GET',
      url: `/api/v1/documents/${ctx.publishedDocId}`,
      headers: { cookie },
    });
    expect(first.statusCode).toBe(200);

    const afterFirst = await prisma.document.findUniqueOrThrow({
      where: { id: ctx.publishedDocId },
      select: { viewCount: true },
    });
    expect(afterFirst.viewCount).toBe(1);

    const second = await ctx.app.inject({
      method: 'GET',
      url: `/api/v1/documents/${ctx.publishedDocId}`,
      headers: { cookie },
    });
    expect(second.statusCode).toBe(200);

    const afterSecond = await prisma.document.findUniqueOrThrow({
      where: { id: ctx.publishedDocId },
      select: { viewCount: true },
    });
    expect(afterSecond.viewCount).toBe(1);
  });

  it('scope-lead GET published does not increment viewCount', async () => {
    const cookie = await ctx.loginAsScopeLead();
    const res = await ctx.app.inject({
      method: 'GET',
      url: `/api/v1/documents/${ctx.publishedDocId}`,
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);

    const row = await prisma.document.findUniqueOrThrow({
      where: { id: ctx.publishedDocId },
      select: { viewCount: true },
    });
    expect(row.viewCount).toBe(0);
  });

  it('draft GET does not increment viewCount', async () => {
    const cookie = await ctx.loginAsScopeLead();
    const res = await ctx.app.inject({
      method: 'GET',
      url: `/api/v1/documents/${ctx.draftDocId}`,
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);

    const row = await prisma.document.findUniqueOrThrow({
      where: { id: ctx.draftDocId },
      select: { viewCount: true },
    });
    expect(row.viewCount).toBe(0);
  });
});

describe('Explore sort by viewCount', () => {
  let ctx: DocumentsTestContext;
  let popularDocId: string;
  let newerDocId: string;

  beforeAll(async () => {
    ctx = await createDocumentsTestContext();

    const older = await prisma.$transaction(async (tx) => {
      const blocks = blockDocumentJsonFromMarkdown('Popular explore content');
      const document = await tx.document.create({
        data: {
          title: 'Popular Explore Doc',
          draftBlocks: blocks,
          contextId: ctx.contextId,
          viewCount: 10,
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
    popularDocId = older.id;

    const newer = await prisma.$transaction(async (tx) => {
      const blocks = blockDocumentJsonFromMarkdown('Newer explore content');
      const document = await tx.document.create({
        data: {
          title: 'Newer Zero-View Doc',
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
    newerDocId = newer.id;
  });

  afterAll(async () => {
    await prisma.document.deleteMany({ where: { id: { in: [popularDocId, newerDocId] } } });
    await disposeDocumentsTestContext(ctx);
  });

  it('orders department explore by viewCount before publishedAt', async () => {
    const cookie = await ctx.loginAsScopeLead();
    const res = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/me/pulse/explore',
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      columns: Array<{ key: string; items: Array<{ id: string }> }>;
    };
    const deptCol = body.columns.find((c) => c.key.startsWith('department:'));
    expect(deptCol).toBeDefined();
    const ids = deptCol!.items.map((i) => i.id);
    const popularIdx = ids.indexOf(popularDocId);
    const newerIdx = ids.indexOf(newerDocId);
    expect(popularIdx).toBeGreaterThanOrEqual(0);
    expect(newerIdx).toBeGreaterThanOrEqual(0);
    expect(popularIdx).toBeLessThan(newerIdx);
  });
});
