import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../../db.js';
import {
  createDocumentsTestContext,
  disposeDocumentsTestContext,
  type DocumentsTestContext,
} from './helpers/documentsTestContext.js';

describe('Do11y Phase 3: create interval, PATCH interval, document detail', () => {
  let ctx: DocumentsTestContext;
  const createdDocIds: string[] = [];

  beforeAll(async () => {
    ctx = await createDocumentsTestContext();
    await prisma.systemSettings.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        healthCheckDefaultIntervalDays: 90,
        healthCheckAutoScanEnabled: false,
      },
      update: { healthCheckDefaultIntervalDays: 90 },
    });
  });

  afterAll(async () => {
    if (createdDocIds.length > 0) {
      await prisma.documentHealthCheckEvent.deleteMany({
        where: { documentId: { in: createdDocIds } },
      });
      await prisma.documentTag.deleteMany({ where: { documentId: { in: createdDocIds } } });
      await prisma.documentGrantUser.deleteMany({ where: { documentId: { in: createdDocIds } } });
      await prisma.document.deleteMany({ where: { id: { in: createdDocIds } } });
    }
    await disposeDocumentsTestContext(ctx);
  });

  it('POST /documents without interval stores org default 90; nextAt stays null', async () => {
    const cookie = await ctx.loginAsScopeLead();
    const res = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/documents',
      headers: { cookie, 'content-type': 'application/json' },
      payload: { title: 'HC create default', contextId: ctx.contextId },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json() as { id: string; healthCheckIntervalDays: number | null };
    createdDocIds.push(body.id);
    expect(body.healthCheckIntervalDays).toBe(90);

    const doc = await prisma.document.findUniqueOrThrow({ where: { id: body.id } });
    expect(doc.healthCheckIntervalDays).toBe(90);
    expect(doc.healthCheckNextAt).toBeNull();
  });

  it('POST /documents with intervalDays stores the whitelist value', async () => {
    const cookie = await ctx.loginAsScopeLead();
    const res = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/documents',
      headers: { cookie, 'content-type': 'application/json' },
      payload: {
        title: 'HC create 30',
        contextId: ctx.contextId,
        healthCheckIntervalDays: 30,
      },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json() as { id: string; healthCheckIntervalDays: number | null };
    createdDocIds.push(body.id);
    expect(body.healthCheckIntervalDays).toBe(30);

    const doc = await prisma.document.findUniqueOrThrow({ where: { id: body.id } });
    expect(doc.healthCheckIntervalDays).toBe(30);
    expect(doc.healthCheckNextAt).toBeNull();
  });

  it('PATCH interval: lead 200, writer 403', async () => {
    const leadCookie = await ctx.loginAsScopeLead();
    const writerCookie = await ctx.loginAsWriter();

    const leadRes = await ctx.app.inject({
      method: 'PATCH',
      url: `/api/v1/documents/${ctx.publishedDocId}/freshness/interval`,
      headers: { cookie: leadCookie, 'content-type': 'application/json' },
      payload: { intervalDays: 60 },
    });
    expect(leadRes.statusCode).toBe(200);
    const leadBody = leadRes.json() as { healthCheckIntervalDays: number };
    expect(leadBody.healthCheckIntervalDays).toBe(60);

    const writerRes = await ctx.app.inject({
      method: 'PATCH',
      url: `/api/v1/documents/${ctx.publishedDocId}/freshness/interval`,
      headers: { cookie: writerCookie, 'content-type': 'application/json' },
      payload: { intervalDays: 180 },
    });
    expect(writerRes.statusCode).toBe(403);

    const doc = await prisma.document.findUniqueOrThrow({ where: { id: ctx.publishedDocId } });
    expect(doc.healthCheckIntervalDays).toBe(60);
  });

  it('GET document: lead canRunHealthCheck true; writer false; health fields present', async () => {
    const leadCookie = await ctx.loginAsScopeLead();
    const writerCookie = await ctx.loginAsWriter();

    const leadRes = await ctx.app.inject({
      method: 'GET',
      url: `/api/v1/documents/${ctx.publishedDocId}`,
      headers: { cookie: leadCookie },
    });
    expect(leadRes.statusCode).toBe(200);
    const leadBody = leadRes.json() as {
      canRunHealthCheck: boolean;
      healthCheckIntervalDays: number | null;
      healthCheckDefaultIntervalDays: number;
      healthCheckAutoScanEnabled: boolean;
      healthCheckNextAt: string | null;
      healthCheckNeedsUpdate: boolean;
    };
    expect(leadBody.canRunHealthCheck).toBe(true);
    expect(leadBody.healthCheckDefaultIntervalDays).toBe(90);
    expect(typeof leadBody.healthCheckAutoScanEnabled).toBe('boolean');
    expect(leadBody.healthCheckIntervalDays).toBe(60);
    expect(typeof leadBody.healthCheckNeedsUpdate).toBe('boolean');
    expect('healthCheckNextAt' in leadBody).toBe(true);

    const writerRes = await ctx.app.inject({
      method: 'GET',
      url: `/api/v1/documents/${ctx.publishedDocId}`,
      headers: { cookie: writerCookie },
    });
    expect(writerRes.statusCode).toBe(200);
    const writerBody = writerRes.json() as {
      canRunHealthCheck: boolean;
      healthCheckIntervalDays: number | null;
    };
    expect(writerBody.canRunHealthCheck).toBe(false);
    expect(writerBody.healthCheckIntervalDays).toBe(60);
  });
});
