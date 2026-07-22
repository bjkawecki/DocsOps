import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { prisma } from '../../../db.js';
import {
  createDocumentsTestContext,
  disposeDocumentsTestContext,
  type DocumentsTestContext,
} from '../../documents/tests/helpers/documentsTestContext.js';

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
