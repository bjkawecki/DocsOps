import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { GrantRole } from '../../../../generated/prisma/client.js';
import { prisma } from '../../../db.js';
import {
  createDocumentsTestContext,
  disposeDocumentsTestContext,
  type DocumentsTestContext,
} from '../../documents/tests/helpers/documentsTestContext.js';
import { blockDocumentJsonFromMarkdown } from '../../documents/services/blocks/documentBlocksBackfill.js';
import { hashPassword } from '../../auth/services/password.js';
import { getCookieHeader } from '../../documents/tests/helpers/httpTestHelpers.js';

describe('Start here (scope start-document + resolve)', () => {
  let ctx: DocumentsTestContext;
  let leadCookie: string;
  let writerCookie: string;
  let teamLeadId: string;
  let teamLeadCookie: string;
  let memberId: string;
  let memberCookie: string;
  let teamOwnedDocId: string;
  let teamOwnedContextId: string;
  let teamOwnedOwnerId: string;
  let teamOwnedProcessId: string;
  let deptStartDocId: string;

  beforeAll(async () => {
    ctx = await createDocumentsTestContext();
    leadCookie = await ctx.loginAsScopeLead();
    writerCookie = await ctx.loginAsWriter();

    const pw = await hashPassword('testpass');
    const teamLead = await prisma.user.create({
      data: {
        name: 'Team Lead StartHere',
        email: `team-lead-start-${Date.now()}@example.com`,
        passwordHash: pw,
      },
    });
    const member = await prisma.user.create({
      data: {
        name: 'Member StartHere',
        email: `member-start-${Date.now()}@example.com`,
        passwordHash: pw,
      },
    });
    teamLeadId = teamLead.id;
    memberId = member.id;

    await Promise.all([
      prisma.teamMember.create({ data: { teamId: ctx.teamId, userId: teamLeadId } }),
      prisma.teamMember.create({ data: { teamId: ctx.teamId, userId: memberId } }),
      prisma.teamLead.create({ data: { teamId: ctx.teamId, userId: teamLeadId } }),
      prisma.documentGrantTeam.create({
        data: { documentId: ctx.publishedDocId, teamId: ctx.teamId, role: GrantRole.Read },
      }),
    ]);

    const teamOwner = await prisma.owner.create({ data: { teamId: ctx.teamId } });
    teamOwnedOwnerId = teamOwner.id;
    const teamCtx = await prisma.context.create({ data: {} });
    teamOwnedContextId = teamCtx.id;
    const teamProcess = await prisma.process.create({
      data: {
        name: `Team Process ${Date.now()}`,
        contextId: teamCtx.id,
        ownerId: teamOwner.id,
      },
    });
    teamOwnedProcessId = teamProcess.id;

    teamOwnedDocId = await prisma.$transaction(async (tx) => {
      const blocksJson = blockDocumentJsonFromMarkdown('# Team start');
      const document = await tx.document.create({
        data: {
          title: 'Team Start Doc',
          draftBlocks: blocksJson,
          contextId: teamCtx.id,
        },
      });
      const version = await tx.documentVersion.create({
        data: {
          documentId: document.id,
          blocks: blocksJson,
          blocksSchemaVersion: 0,
          versionNumber: 1,
          createdById: teamLeadId,
        },
      });
      await tx.document.update({
        where: { id: document.id },
        data: {
          publishedAt: new Date(),
          currentPublishedVersionId: version.id,
        },
      });
      await tx.documentGrantTeam.create({
        data: { documentId: document.id, teamId: ctx.teamId, role: GrantRole.Read },
      });
      return document.id;
    });

    deptStartDocId = ctx.publishedDocId;

    const login = async (email: string) => {
      const res = await ctx.app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: { email, password: 'testpass' },
      });
      expect(res.statusCode).toBe(204);
      return getCookieHeader(res.headers['set-cookie']);
    };
    teamLeadCookie = await login(teamLead.email);
    memberCookie = await login(member.email);
  });

  afterAll(async () => {
    if (!ctx) return;
    await prisma.team.update({
      where: { id: ctx.teamId },
      data: { startDocumentId: null },
    });
    await prisma.department.update({
      where: { id: ctx.departmentId },
      data: { startDocumentId: null },
    });
    await prisma.company.update({
      where: { id: ctx.companyId },
      data: { startDocumentId: null },
    });
    if (teamOwnedDocId) {
      await prisma.documentGrantTeam.deleteMany({ where: { documentId: teamOwnedDocId } });
      await prisma.document.deleteMany({ where: { id: teamOwnedDocId } });
    }
    if (teamOwnedProcessId) {
      await prisma.process.deleteMany({ where: { id: teamOwnedProcessId } });
    }
    if (teamOwnedContextId) {
      await prisma.context.deleteMany({ where: { id: teamOwnedContextId } });
    }
    if (teamOwnedOwnerId) {
      await prisma.owner.deleteMany({ where: { id: teamOwnedOwnerId } });
    }
    await prisma.documentGrantTeam.deleteMany({
      where: { documentId: ctx.publishedDocId, teamId: ctx.teamId },
    });
    await prisma.teamLead.deleteMany({ where: { userId: teamLeadId } });
    await prisma.teamMember.deleteMany({
      where: { userId: { in: [teamLeadId, memberId] } },
    });
    await prisma.session.deleteMany({ where: { userId: { in: [teamLeadId, memberId] } } });
    await prisma.user.deleteMany({ where: { id: { in: [teamLeadId, memberId] } } });
    await disposeDocumentsTestContext(ctx);
  });

  it('department lead can set and clear department start-document', async () => {
    const setRes = await ctx.app.inject({
      method: 'PUT',
      url: `/api/v1/departments/${ctx.departmentId}/start-document`,
      headers: { cookie: leadCookie },
      payload: { documentId: deptStartDocId },
    });
    expect(setRes.statusCode).toBe(204);

    const dept = await prisma.department.findUniqueOrThrow({
      where: { id: ctx.departmentId },
      select: { startDocumentId: true },
    });
    expect(dept.startDocumentId).toBe(deptStartDocId);

    const clearRes = await ctx.app.inject({
      method: 'DELETE',
      url: `/api/v1/departments/${ctx.departmentId}/start-document`,
      headers: { cookie: leadCookie },
    });
    expect(clearRes.statusCode).toBe(204);
    const cleared = await prisma.department.findUniqueOrThrow({
      where: { id: ctx.departmentId },
      select: { startDocumentId: true },
    });
    expect(cleared.startDocumentId).toBeNull();
  });

  it('non-lead gets 403 when setting start-document', async () => {
    const res = await ctx.app.inject({
      method: 'PUT',
      url: `/api/v1/departments/${ctx.departmentId}/start-document`,
      headers: { cookie: writerCookie },
      payload: { documentId: deptStartDocId },
    });
    expect(res.statusCode).toBe(403);
  });

  it('rejects unpublished document with 400', async () => {
    const res = await ctx.app.inject({
      method: 'PUT',
      url: `/api/v1/departments/${ctx.departmentId}/start-document`,
      headers: { cookie: leadCookie },
      payload: { documentId: ctx.draftDocId },
    });
    expect(res.statusCode).toBe(400);
  });

  it('team lead can set team start; list returns team and department items', async () => {
    await ctx.app.inject({
      method: 'PUT',
      url: `/api/v1/departments/${ctx.departmentId}/start-document`,
      headers: { cookie: leadCookie },
      payload: { documentId: deptStartDocId },
    });
    const setTeam = await ctx.app.inject({
      method: 'PUT',
      url: `/api/v1/teams/${ctx.teamId}/start-document`,
      headers: { cookie: teamLeadCookie },
      payload: { documentId: teamOwnedDocId },
    });
    expect(setTeam.statusCode).toBe(204);

    const resolve = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/me/pulse/start-here',
      headers: { cookie: memberCookie },
    });
    expect(resolve.statusCode).toBe(200);
    const body = resolve.json() as {
      items: Array<{ documentId: string; scopeType: string; scopeId: string }>;
    };
    expect(body.items).toHaveLength(2);
    expect(body.items[0]?.scopeType).toBe('team');
    expect(body.items[0]?.documentId).toBe(teamOwnedDocId);
    expect(body.items[0]?.scopeId).toBe(ctx.teamId);
    expect(body.items[1]?.scopeType).toBe('department');
    expect(body.items[1]?.documentId).toBe(deptStartDocId);
  });

  it('lists department only when team start is cleared', async () => {
    const clearTeam = await ctx.app.inject({
      method: 'DELETE',
      url: `/api/v1/teams/${ctx.teamId}/start-document`,
      headers: { cookie: teamLeadCookie },
    });
    expect(clearTeam.statusCode).toBe(204);

    const resolve = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/me/pulse/start-here',
      headers: { cookie: memberCookie },
    });
    expect(resolve.statusCode).toBe(200);
    const body = resolve.json() as {
      items: Array<{ scopeType: string; documentId: string }>;
    };
    expect(body.items).toHaveLength(1);
    expect(body.items[0]?.scopeType).toBe('department');
    expect(body.items[0]?.documentId).toBe(deptStartDocId);
  });

  it('skips unpublished start document and returns empty items', async () => {
    await prisma.department.update({
      where: { id: ctx.departmentId },
      data: { startDocumentId: null },
    });
    await prisma.team.update({
      where: { id: ctx.teamId },
      data: { startDocumentId: ctx.draftDocId },
    });

    const resolve = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/me/pulse/start-here',
      headers: { cookie: memberCookie },
    });
    expect(resolve.statusCode).toBe(200);
    expect(resolve.json()).toEqual({ items: [] });

    await prisma.team.update({
      where: { id: ctx.teamId },
      data: { startDocumentId: null },
    });
  });

  it('document detail includes startHereScopes for department lead', async () => {
    await ctx.app.inject({
      method: 'PUT',
      url: `/api/v1/departments/${ctx.departmentId}/start-document`,
      headers: { cookie: leadCookie },
      payload: { documentId: deptStartDocId },
    });

    const res = await ctx.app.inject({
      method: 'GET',
      url: `/api/v1/documents/${deptStartDocId}`,
      headers: { cookie: leadCookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      startHereScopes: Array<{
        scopeType: string;
        scopeId: string;
        isCurrent: boolean;
      }>;
    };
    const deptOpt = body.startHereScopes.find(
      (s) => s.scopeType === 'department' && s.scopeId === ctx.departmentId
    );
    expect(deptOpt?.isCurrent).toBe(true);
  });

  it('admin without membership gets team/dept/company start items via org fallback', async () => {
    await prisma.team.update({
      where: { id: ctx.teamId },
      data: { startDocumentId: teamOwnedDocId },
    });
    await prisma.department.update({
      where: { id: ctx.departmentId },
      data: { startDocumentId: deptStartDocId },
    });
    await prisma.company.update({
      where: { id: ctx.companyId },
      data: { startDocumentId: deptStartDocId },
    });

    const pw = await hashPassword('testpass');
    const admin = await prisma.user.create({
      data: {
        name: 'Admin StartHere',
        email: `admin-start-${Date.now()}@example.com`,
        passwordHash: pw,
        isAdmin: true,
      },
    });
    const loginRes = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: admin.email, password: 'testpass' },
    });
    expect(loginRes.statusCode).toBe(204);
    const adminCookie = getCookieHeader(loginRes.headers['set-cookie']);

    const resolve = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/me/pulse/start-here',
      headers: { cookie: adminCookie },
    });
    expect(resolve.statusCode).toBe(200);
    const body = resolve.json() as {
      items: Array<{ scopeType: string; documentId: string }>;
    };
    const types = body.items.map((i) => i.scopeType);
    expect(types).toContain('team');
    expect(types).toContain('department');
    expect(types).toContain('company');

    await prisma.session.deleteMany({ where: { userId: admin.id } });
    await prisma.user.delete({ where: { id: admin.id } });
  });
});
