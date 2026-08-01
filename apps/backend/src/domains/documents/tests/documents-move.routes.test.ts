import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../../../db.js';
import { blockDocumentJsonFromMarkdown } from '../services/blocks/documentBlocksBackfill.js';
import {
  createDocumentsTestContext,
  disposeDocumentsTestContext,
  type DocumentsTestContext,
} from './helpers/documentsTestContext.js';

describe('POST /documents/:id/move (same-owner)', () => {
  let ctx: DocumentsTestContext;
  let sameOwnerTargetContextId: string;
  let sameOwnerTargetProcessId: string;
  let otherOwnerContextId: string;
  let otherOwnerProcessId: string;
  let otherOwnerId: string;
  let otherCompanyId: string;

  beforeAll(async () => {
    ctx = await createDocumentsTestContext();

    const sameOwnerContext = await prisma.context.create({ data: {} });
    const sameOwnerProcess = await prisma.process.create({
      data: {
        name: `Move Target Process ${Date.now()}`,
        contextId: sameOwnerContext.id,
        ownerId: ctx.ownerId,
      },
    });
    sameOwnerTargetContextId = sameOwnerContext.id;
    sameOwnerTargetProcessId = sameOwnerProcess.id;

    const otherCompany = await prisma.company.create({
      data: { name: `Other Co ${Date.now()}` },
    });
    otherCompanyId = otherCompany.id;
    const otherOwner = await prisma.owner.create({ data: { companyId: otherCompany.id } });
    otherOwnerId = otherOwner.id;
    const otherContext = await prisma.context.create({ data: {} });
    const otherProcess = await prisma.process.create({
      data: {
        name: `Other Owner Process ${Date.now()}`,
        contextId: otherContext.id,
        ownerId: otherOwner.id,
      },
    });
    otherOwnerContextId = otherContext.id;
    otherOwnerProcessId = otherProcess.id;
  });

  afterAll(async () => {
    await prisma.process.deleteMany({
      where: { id: { in: [sameOwnerTargetProcessId, otherOwnerProcessId].filter(Boolean) } },
    });
    await prisma.context.deleteMany({
      where: { id: { in: [sameOwnerTargetContextId, otherOwnerContextId].filter(Boolean) } },
    });
    if (otherOwnerId) await prisma.owner.deleteMany({ where: { id: otherOwnerId } });
    if (otherCompanyId) await prisma.company.deleteMany({ where: { id: otherCompanyId } });
    await disposeDocumentsTestContext(ctx);
  });

  it('scope lead moves draft to another same-owner context', async () => {
    const cookie = await ctx.loginAsScopeLead();
    const res = await ctx.app.inject({
      method: 'POST',
      url: `/api/v1/documents/${ctx.draftDocId}/move`,
      headers: { cookie },
      payload: { targetContextId: sameOwnerTargetContextId },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { contextId: string };
    expect(body.contextId).toBe(sameOwnerTargetContextId);

    const getRes = await ctx.app.inject({
      method: 'GET',
      url: `/api/v1/documents/${ctx.draftDocId}`,
      headers: { cookie },
    });
    expect(getRes.statusCode).toBe(200);
    const detail = getRes.json() as { contextId: string; canMove: boolean };
    expect(detail.contextId).toBe(sameOwnerTargetContextId);
    expect(detail.canMove).toBe(true);

    // Move back for later tests that assume original context
    await ctx.app.inject({
      method: 'POST',
      url: `/api/v1/documents/${ctx.draftDocId}/move`,
      headers: { cookie },
      payload: { targetContextId: ctx.contextId },
    });
  });

  it('writer (grant only) cannot move → 403', async () => {
    const cookie = await ctx.loginAsWriter();
    const res = await ctx.app.inject({
      method: 'POST',
      url: `/api/v1/documents/${ctx.draftDocId}/move`,
      headers: { cookie },
      payload: { targetContextId: sameOwnerTargetContextId },
    });
    expect(res.statusCode).toBe(403);
  });

  it('cross-owner target → 409', async () => {
    const cookie = await ctx.loginAsScopeLead();
    const res = await ctx.app.inject({
      method: 'POST',
      url: `/api/v1/documents/${ctx.draftDocId}/move`,
      headers: { cookie },
      payload: { targetContextId: otherOwnerContextId },
    });
    expect(res.statusCode).toBe(409);
  });

  it('context-free draft cannot move → 400', async () => {
    const cookie = await ctx.loginAsScopeLead();
    const free = await prisma.document.create({
      data: {
        title: 'Context free for move test',
        draftBlocks: blockDocumentJsonFromMarkdown('x'),
        contextId: null,
        createdById: ctx.scopeLeadId,
      },
    });
    try {
      const res = await ctx.app.inject({
        method: 'POST',
        url: `/api/v1/documents/${free.id}/move`,
        headers: { cookie },
        payload: { targetContextId: sameOwnerTargetContextId },
      });
      expect(res.statusCode).toBe(400);
    } finally {
      await prisma.document.delete({ where: { id: free.id } });
    }
  });

  it('PATCH context A→B is rejected; use move', async () => {
    const cookie = await ctx.loginAsScopeLead();
    const res = await ctx.app.inject({
      method: 'PATCH',
      url: `/api/v1/documents/${ctx.draftDocId}`,
      headers: { cookie },
      payload: { contextId: sameOwnerTargetContextId },
    });
    expect(res.statusCode).toBe(400);
    const body = res.json() as { error: string };
    expect(body.error).toMatch(/move/i);
  });
});
