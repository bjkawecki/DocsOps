import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../../../db.js';
import {
  createDocumentsTestContext,
  disposeDocumentsTestContext,
  type DocumentsTestContext,
} from '../../documents/tests/helpers/documentsTestContext.js';

describe('GET /api/v1/me/reviews', () => {
  let ctx: DocumentsTestContext;

  const draftWithSuggestion = {
    schemaVersion: 1,
    blocks: [
      {
        id: 'p-review-1',
        type: 'paragraph',
        content: [
          {
            id: 'leaf-1',
            type: 'text',
            attrs: {},
            meta: {
              text: 'Suggested',
              suggestion: {
                id: 's-review-1',
                kind: 'insert',
                authorId: '',
                status: 'pending',
                createdAt: '2026-06-16T12:00:00.000Z',
              },
            },
          },
        ],
      },
    ],
  };

  beforeAll(async () => {
    ctx = await createDocumentsTestContext();
    await prisma.document.update({
      where: { id: ctx.publishedDocId },
      data: {
        draftBlocks: {
          ...draftWithSuggestion,
          blocks: [
            {
              ...draftWithSuggestion.blocks[0],
              content: [
                {
                  ...draftWithSuggestion.blocks[0].content[0],
                  meta: {
                    ...draftWithSuggestion.blocks[0].content[0].meta,
                    suggestion: {
                      ...(draftWithSuggestion.blocks[0].content[0].meta as { suggestion: object })
                        .suggestion,
                      authorId: ctx.scopeAuthorId,
                    },
                  },
                },
              ],
            },
          ],
        },
      },
    });
  });

  afterAll(async () => {
    await disposeDocumentsTestContext(ctx);
  });

  it('returns 401 without session', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/api/v1/me/reviews' });
    expect(res.statusCode).toBe(401);
  });

  it('lead sees document with pending suggestions in pendingForReview', async () => {
    const cookie = await ctx.loginAsScopeLead();
    const res = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/me/reviews',
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      pendingForReview: Array<{ documentId: string; pendingSuggestionCount: number }>;
      totalPendingForReview: number;
    };
    expect(body.totalPendingForReview).toBeGreaterThanOrEqual(1);
    const row = body.pendingForReview.find((r) => r.documentId === ctx.publishedDocId);
    expect(row).toBeDefined();
    expect(row?.pendingSuggestionCount).toBeGreaterThanOrEqual(1);
  });

  it('author does not see pending list (lead inbox only)', async () => {
    const cookie = await ctx.loginAsScopeAuthor();
    const res = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/me/reviews',
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      pendingForReview: unknown[];
      totalPendingForReview: number;
    };
    expect(body.pendingForReview).toEqual([]);
    expect(body.totalPendingForReview).toBe(0);
  });

  it('reader-only sees empty list', async () => {
    const cookie = await ctx.loginAsReaderOnly();
    const res = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/me/reviews',
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      pendingForReview: unknown[];
    };
    expect(body.pendingForReview).toEqual([]);
  });
});
