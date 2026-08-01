import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../../../db.js';
import { hashPassword } from '../../auth/services/password.js';
import { blockDocumentJsonFromMarkdown } from '../services/blocks/documentBlocksBackfill.js';
import { getCookieHeader } from './helpers/httpTestHelpers.js';
import {
  createDocumentsTestContext,
  disposeDocumentsTestContext,
  type DocumentsTestContext,
} from './helpers/documentsTestContext.js';

describe('Document move requests (cross-owner)', () => {
  let ctx: DocumentsTestContext;
  let sameOwnerTargetContextId: string;
  let sameOwnerTargetProcessId: string;
  let otherOwnerContextId: string;
  let otherOwnerProcessId: string;
  let otherOwnerId: string;
  let otherCompanyId: string;
  let otherLeadId: string;
  let otherLeadEmail: string;
  let taggedDocId: string;
  let tagId: string;

  async function loginAsOtherLead(): Promise<string> {
    const response = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: otherLeadEmail, password: 'testpass' },
    });
    if (response.statusCode !== 204) {
      throw new Error(`Login failed for other lead (status ${response.statusCode})`);
    }
    return getCookieHeader(response.headers['set-cookie']);
  }

  beforeAll(async () => {
    ctx = await createDocumentsTestContext();

    const sameOwnerContext = await prisma.context.create({ data: {} });
    const sameOwnerProcess = await prisma.process.create({
      data: {
        name: `Move Req Same ${Date.now()}`,
        contextId: sameOwnerContext.id,
        ownerId: ctx.ownerId,
      },
    });
    sameOwnerTargetContextId = sameOwnerContext.id;
    sameOwnerTargetProcessId = sameOwnerProcess.id;

    const otherCompany = await prisma.company.create({
      data: { name: `Other Co MoveReq ${Date.now()}` },
    });
    otherCompanyId = otherCompany.id;
    const otherOwner = await prisma.owner.create({ data: { companyId: otherCompany.id } });
    otherOwnerId = otherOwner.id;
    const otherContext = await prisma.context.create({ data: {} });
    const otherProcess = await prisma.process.create({
      data: {
        name: `Other Owner Process MoveReq ${Date.now()}`,
        contextId: otherContext.id,
        ownerId: otherOwner.id,
      },
    });
    otherOwnerContextId = otherContext.id;
    otherOwnerProcessId = otherProcess.id;

    otherLeadEmail = `other-lead-move-${Date.now()}@example.com`;
    const passwordHash = await hashPassword('testpass');
    const otherLead = await prisma.user.create({
      data: {
        email: otherLeadEmail,
        name: 'Other Company Lead',
        passwordHash,
      },
    });
    otherLeadId = otherLead.id;
    await prisma.companyLead.create({
      data: { companyId: otherCompany.id, userId: otherLead.id },
    });

    const tag = await prisma.tag.create({
      data: { name: `MoveTag ${Date.now()}`, ownerId: ctx.ownerId },
    });
    tagId = tag.id;
    const tagged = await prisma.document.create({
      data: {
        title: 'Tagged for move request',
        draftBlocks: blockDocumentJsonFromMarkdown('Tagged draft'),
        contextId: ctx.contextId,
        createdById: ctx.scopeLeadId,
        documentTags: { create: [{ tagId: tag.id }] },
      },
    });
    taggedDocId = tagged.id;
  });

  afterAll(async () => {
    await prisma.documentMoveRequest.deleteMany({
      where: { documentId: { in: [ctx.draftDocId, taggedDocId].filter(Boolean) } },
    });
    if (taggedDocId) {
      await prisma.documentTag.deleteMany({ where: { documentId: taggedDocId } });
      await prisma.document.deleteMany({ where: { id: taggedDocId } });
    }
    if (tagId) await prisma.tag.deleteMany({ where: { id: tagId } });
    await prisma.companyLead.deleteMany({ where: { userId: otherLeadId } });
    if (otherLeadId) await prisma.user.deleteMany({ where: { id: otherLeadId } });
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

  it('same-owner target cannot create move request → 400', async () => {
    const cookie = await ctx.loginAsScopeLead();
    const res = await ctx.app.inject({
      method: 'POST',
      url: `/api/v1/documents/${ctx.draftDocId}/move-requests`,
      headers: { cookie },
      payload: { targetContextId: sameOwnerTargetContextId },
    });
    expect(res.statusCode).toBe(400);
  });

  it('writer cannot create move request → 403', async () => {
    const cookie = await ctx.loginAsWriter();
    const res = await ctx.app.inject({
      method: 'POST',
      url: `/api/v1/documents/${ctx.draftDocId}/move-requests`,
      headers: { cookie },
      payload: { targetContextId: otherOwnerContextId },
    });
    expect(res.statusCode).toBe(403);
  });

  it('create → accept strips tags; second pending blocked; withdraw works', async () => {
    const senderCookie = await ctx.loginAsScopeLead();
    const createRes = await ctx.app.inject({
      method: 'POST',
      url: `/api/v1/documents/${taggedDocId}/move-requests`,
      headers: { cookie: senderCookie },
      payload: { targetContextId: otherOwnerContextId, note: 'Please take this' },
    });
    expect(createRes.statusCode).toBe(201);
    const created = createRes.json() as { id: string; status: string };
    expect(created.status).toBe('pending');

    const second = await ctx.app.inject({
      method: 'POST',
      url: `/api/v1/documents/${taggedDocId}/move-requests`,
      headers: { cookie: senderCookie },
      payload: { targetContextId: otherOwnerContextId },
    });
    expect(second.statusCode).toBe(409);

    const getSender = await ctx.app.inject({
      method: 'GET',
      url: `/api/v1/documents/${taggedDocId}`,
      headers: { cookie: senderCookie },
    });
    expect(getSender.statusCode).toBe(200);
    const senderDetail = getSender.json() as {
      pendingMoveRequest: { id: string; canWithdraw: boolean } | null;
      canRequestMove: boolean;
    };
    expect(senderDetail.canRequestMove).toBe(false);
    expect(senderDetail.pendingMoveRequest?.id).toBe(created.id);
    expect(senderDetail.pendingMoveRequest?.canWithdraw).toBe(true);

    const otherCookie = await loginAsOtherLead();
    const acceptRes = await ctx.app.inject({
      method: 'POST',
      url: `/api/v1/documents/${taggedDocId}/move-requests/${created.id}/accept`,
      headers: { cookie: otherCookie },
      payload: {},
    });
    expect(acceptRes.statusCode).toBe(200);
    const accepted = acceptRes.json() as {
      document: { contextId: string; documentTags: unknown[] };
      request: { status: string };
    };
    expect(accepted.request.status).toBe('accepted');
    expect(accepted.document.contextId).toBe(otherOwnerContextId);
    expect(accepted.document.documentTags).toEqual([]);

    const tagsLeft = await prisma.documentTag.count({ where: { documentId: taggedDocId } });
    expect(tagsLeft).toBe(0);

    // Move back via request again for withdraw test on draftDoc
    const create2 = await ctx.app.inject({
      method: 'POST',
      url: `/api/v1/documents/${ctx.draftDocId}/move-requests`,
      headers: { cookie: senderCookie },
      payload: { targetContextId: otherOwnerContextId },
    });
    expect(create2.statusCode).toBe(201);
    const req2 = create2.json() as { id: string };

    const withdrawRes = await ctx.app.inject({
      method: 'POST',
      url: `/api/v1/documents/${ctx.draftDocId}/move-requests/${req2.id}/withdraw`,
      headers: { cookie: senderCookie },
      payload: {},
    });
    expect(withdrawRes.statusCode).toBe(200);
    expect((withdrawRes.json() as { status: string }).status).toBe('withdrawn');

    const acceptAfterWithdraw = await ctx.app.inject({
      method: 'POST',
      url: `/api/v1/documents/${ctx.draftDocId}/move-requests/${req2.id}/accept`,
      headers: { cookie: otherCookie },
      payload: {},
    });
    expect(acceptAfterWithdraw.statusCode).toBe(403);
  });

  it('reject notifies and leaves document in place', async () => {
    const senderCookie = await ctx.loginAsScopeLead();
    const createRes = await ctx.app.inject({
      method: 'POST',
      url: `/api/v1/documents/${ctx.draftDocId}/move-requests`,
      headers: { cookie: senderCookie },
      payload: { targetContextId: otherOwnerContextId },
    });
    expect(createRes.statusCode).toBe(201);
    const created = createRes.json() as { id: string };

    const otherCookie = await loginAsOtherLead();
    const rejectRes = await ctx.app.inject({
      method: 'POST',
      url: `/api/v1/documents/${ctx.draftDocId}/move-requests/${created.id}/reject`,
      headers: { cookie: otherCookie },
      payload: { decisionNote: 'Not now' },
    });
    expect(rejectRes.statusCode).toBe(200);
    expect((rejectRes.json() as { status: string }).status).toBe('rejected');

    const doc = await prisma.document.findUnique({
      where: { id: ctx.draftDocId },
      select: { contextId: true },
    });
    expect(doc?.contextId).toBe(ctx.contextId);
  });

  it('GET /me/move-requests lists inbound pending for target lead', async () => {
    const senderCookie = await ctx.loginAsScopeLead();
    const createRes = await ctx.app.inject({
      method: 'POST',
      url: `/api/v1/documents/${ctx.draftDocId}/move-requests`,
      headers: { cookie: senderCookie },
      payload: { targetContextId: otherOwnerContextId },
    });
    expect(createRes.statusCode).toBe(201);
    const created = createRes.json() as { id: string };

    const otherCookie = await loginAsOtherLead();
    const listRes = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/me/move-requests?direction=inbound&status=pending',
      headers: { cookie: otherCookie },
    });
    expect(listRes.statusCode).toBe(200);
    const list = listRes.json() as { items: { id: string; canAccept: boolean }[] };
    expect(list.items.some((i) => i.id === created.id && i.canAccept)).toBe(true);

    await ctx.app.inject({
      method: 'POST',
      url: `/api/v1/documents/${ctx.draftDocId}/move-requests/${created.id}/withdraw`,
      headers: { cookie: senderCookie },
      payload: {},
    });
  });

  it('Phase-1 POST /move cross-owner still 409 with move-request hint', async () => {
    const cookie = await ctx.loginAsScopeLead();
    const res = await ctx.app.inject({
      method: 'POST',
      url: `/api/v1/documents/${ctx.draftDocId}/move`,
      headers: { cookie },
      payload: { targetContextId: otherOwnerContextId },
    });
    expect(res.statusCode).toBe(409);
    expect((res.json() as { error: string }).error).toMatch(/move-requests/i);
  });
});
