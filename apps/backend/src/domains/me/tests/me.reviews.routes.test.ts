import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../../../db.js';
import {
  createDocumentsTestContext,
  disposeDocumentsTestContext,
  type DocumentsTestContext,
} from '../../documents/tests/helpers/documentsTestContext.js';

describe('GET /api/v1/me/reviews', () => {
  let ctx: DocumentsTestContext;
  let changeId: string;

  beforeAll(async () => {
    ctx = await createDocumentsTestContext();
    await prisma.documentDraftCycle.create({
      data: {
        documentId: ctx.publishedDocId,
        baseBlocks: { schemaVersion: 0, blocks: [] },
      },
    });
    const change = await prisma.documentDraftChange.create({
      data: {
        documentId: ctx.publishedDocId,
        revisionFrom: 0,
        revisionTo: 1,
        savedById: ctx.scopeAuthorId,
        ops: [
          {
            op: 'replaceBlock',
            blockId: 'block-1',
            block: {
              id: 'block-1',
              type: 'paragraph',
              content: [{ id: 't1', type: 'text', meta: { text: 'New' } }],
            },
          },
        ],
        affectedBlockIds: ['block-1'],
      },
    });
    changeId = change.id;
  });

  afterAll(async () => {
    if (changeId) {
      await prisma.documentDraftChange.deleteMany({ where: { id: changeId } });
    }
    await prisma.documentDraftCycle.deleteMany({ where: { documentId: ctx.publishedDocId } });
    await disposeDocumentsTestContext(ctx);
  });

  it('returns 401 without session', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/api/v1/me/reviews' });
    expect(res.statusCode).toBe(401);
  });

  it('lead sees document with author changes in pendingForReview', async () => {
    const cookie = await ctx.loginAsScopeLead();
    const res = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/me/reviews',
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      pendingForReview: Array<{ documentId: string; changeCount: number }>;
      totalPendingForReview: number;
    };
    expect(body.totalPendingForReview).toBeGreaterThanOrEqual(1);
    const row = body.pendingForReview.find((r) => r.documentId === ctx.publishedDocId);
    expect(row).toBeDefined();
    expect(row?.changeCount).toBeGreaterThanOrEqual(1);
  });

  it('author sees own change in myChanges', async () => {
    const cookie = await ctx.loginAsScopeAuthor();
    const res = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/me/reviews',
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      myChanges: Array<{ changeId: string; documentId: string }>;
      totalMyChanges: number;
      pendingForReview: unknown[];
    };
    expect(body.totalMyChanges).toBeGreaterThanOrEqual(1);
    expect(body.myChanges.some((row) => row.changeId === changeId)).toBe(true);
    expect(body.pendingForReview).toEqual([]);
  });

  it('reader-only sees empty lists', async () => {
    const cookie = await ctx.loginAsReaderOnly();
    const res = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/me/reviews',
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      pendingForReview: unknown[];
      myChanges: unknown[];
    };
    expect(body.pendingForReview).toEqual([]);
    expect(body.myChanges).toEqual([]);
  });
});
