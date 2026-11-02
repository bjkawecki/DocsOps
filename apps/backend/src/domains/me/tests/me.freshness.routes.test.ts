import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../../db.js';
import { hashPassword } from '../../auth/services/password.js';
import { emptyBlockDocumentJson } from '../../documents/services/blocks/documentBlocksBackfill.js';
import { getCookieHeader } from '../../documents/tests/helpers/httpTestHelpers.js';
import {
  createDocumentsTestContext,
  disposeDocumentsTestContext,
  type DocumentsTestContext,
} from '../../documents/tests/helpers/documentsTestContext.js';
import { addDays } from '../../documents/services/healthCheck/healthCheckPolicy.js';
import type { buildApp } from '../../../app.js';

const PASSWORD = 'testpass';

describe('me freshness hub + document actions', () => {
  let ctx: DocumentsTestContext;
  let dueDocId: string;
  let draftDocId: string;
  let archivedDocId: string;
  let needsUpdateDocId: string;
  let adminId: string;
  let adminEmail: string;
  let memberId: string;
  let memberEmail: string;
  let memberCookie: string;
  let adminApp: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => {
    ctx = await createDocumentsTestContext();
    adminApp = ctx.app;

    await prisma.systemSettings.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        healthCheckDefaultIntervalDays: 90,
        healthCheckAutoScanEnabled: false,
      },
      update: {
        healthCheckDefaultIntervalDays: 90,
      },
    });

    const pw = await hashPassword(PASSWORD);
    const TS = Date.now();
    adminEmail = `hc-admin-${TS}@test.de`;
    memberEmail = `hc-member-${TS}@test.de`;
    const [admin, member] = await Promise.all([
      prisma.user.create({
        data: {
          name: 'HC Admin',
          email: adminEmail,
          passwordHash: pw,
          isAdmin: true,
        },
      }),
      prisma.user.create({
        data: { name: 'HC Member', email: memberEmail, passwordHash: pw },
      }),
    ]);
    adminId = admin.id;
    memberId = member.id;
    await prisma.teamMember.create({ data: { teamId: ctx.teamId, userId: memberId } });

    const memberLogin = await adminApp.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: memberEmail, password: PASSWORD },
    });
    memberCookie = getCookieHeader(memberLogin.headers['set-cookie']);

    const past = new Date('2020-01-01T00:00:00.000Z');
    const blocks = emptyBlockDocumentJson();

    async function createPublished(title: string, extra: Record<string, unknown> = {}) {
      return prisma.$transaction(async (tx) => {
        const document = await tx.document.create({
          data: {
            title,
            draftBlocks: blocks,
            contextId: ctx.contextId,
            ...extra,
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
        return tx.document.update({
          where: { id: document.id },
          data: {
            publishedAt: past,
            currentPublishedVersionId: version.id,
            healthCheckNextAt: past,
            ...(extra as object),
          },
        });
      });
    }

    dueDocId = (await createPublished(`HC Due ${TS}`)).id;
    needsUpdateDocId = (
      await createPublished(`HC Needs ${TS}`, {
        healthCheckNeedsUpdate: true,
        healthCheckNextAt: addDays(new Date(), 30),
      })
    ).id;

    draftDocId = (
      await prisma.document.create({
        data: {
          title: `HC Draft ${TS}`,
          draftBlocks: blocks,
          contextId: ctx.contextId,
          healthCheckNextAt: past,
          healthCheckNeedsUpdate: true,
        },
      })
    ).id;

    const archived = await createPublished(`HC Archived ${TS}`);
    await prisma.document.update({
      where: { id: archived.id },
      data: { archivedAt: new Date() },
    });
    archivedDocId = archived.id;
  });

  afterAll(async () => {
    const docIds = [dueDocId, needsUpdateDocId, draftDocId, archivedDocId].filter(Boolean);
    await prisma.documentHealthCheckEvent.deleteMany({
      where: { documentId: { in: docIds } },
    });
    await prisma.document.updateMany({
      where: { id: { in: docIds } },
      data: { currentPublishedVersionId: null, publishedAt: null, archivedAt: null },
    });
    await prisma.documentVersion.deleteMany({ where: { documentId: { in: docIds } } });
    await prisma.document.deleteMany({ where: { id: { in: docIds } } });
    await prisma.teamMember.deleteMany({ where: { userId: memberId } });
    await prisma.session.deleteMany({ where: { userId: { in: [adminId, memberId] } } });
    await prisma.user.deleteMany({ where: { id: { in: [adminId, memberId] } } });
    await disposeDocumentsTestContext(ctx);
  });

  it('GET list: lead sees action_needed; draft/archive excluded; outcome filter works', async () => {
    const cookie = await ctx.loginAsScopeLead();
    const res = await adminApp.inject({
      method: 'GET',
      url: '/api/v1/me/freshness?reason=all&outcome=all&limit=50',
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      items: {
        documentId: string;
        reason: string | null;
        outcome: string;
        attentionHint: string | null;
      }[];
      total: number;
    };
    const ids = body.items.map((i) => i.documentId);
    expect(ids).toContain(dueDocId);
    expect(ids).toContain(needsUpdateDocId);
    expect(ids).not.toContain(draftDocId);
    expect(ids).not.toContain(archivedDocId);
    expect(body.items.every((i) => 'attentionHint' in i)).toBe(true);

    const needsOnly = await adminApp.inject({
      method: 'GET',
      url: '/api/v1/me/freshness?reason=all&outcome=needs_update&limit=50',
      headers: { cookie },
    });
    const needsBody = needsOnly.json() as { items: { documentId: string }[] };
    expect(needsBody.items.map((i) => i.documentId)).toContain(needsUpdateDocId);
    expect(needsBody.items.map((i) => i.documentId)).not.toContain(dueDocId);
  });

  it('GET list: attentionHint high_traffic when views and age qualify', async () => {
    const cookie = await ctx.loginAsScopeLead();
    await prisma.document.update({
      where: { id: dueDocId },
      data: {
        viewCount: 5,
        publishedAt: new Date('2020-01-01T00:00:00.000Z'),
      },
    });
    const res = await adminApp.inject({
      method: 'GET',
      url: '/api/v1/me/freshness?reason=all&outcome=all&limit=50',
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      items: { documentId: string; attentionHint: string | null }[];
    };
    const due = body.items.find((i) => i.documentId === dueDocId);
    expect(due?.attentionHint).toBe('high_traffic');

    await prisma.document.update({
      where: { id: dueDocId },
      data: { viewCount: 0 },
    });
    const resLow = await adminApp.inject({
      method: 'GET',
      url: '/api/v1/me/freshness?reason=all&outcome=all&limit=50',
      headers: { cookie },
    });
    const lowBody = resLow.json() as {
      items: { documentId: string; attentionHint: string | null }[];
    };
    expect(lowBody.items.find((i) => i.documentId === dueDocId)?.attentionHint).toBeNull();
  });

  it('GET/POST scan: member and admin get 403', async () => {
    const memberList = await adminApp.inject({
      method: 'GET',
      url: '/api/v1/me/freshness',
      headers: { cookie: memberCookie },
    });
    expect(memberList.statusCode).toBe(403);

    const adminLogin = await adminApp.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: adminEmail, password: PASSWORD },
    });
    const adminCookie = getCookieHeader(adminLogin.headers['set-cookie']);
    const adminList = await adminApp.inject({
      method: 'GET',
      url: '/api/v1/me/freshness',
      headers: { cookie: adminCookie },
    });
    expect(adminList.statusCode).toBe(403);

    const adminScan = await adminApp.inject({
      method: 'POST',
      url: '/api/v1/me/freshness/scan',
      headers: { cookie: adminCookie, 'content-type': 'application/json' },
      payload: {},
    });
    expect(adminScan.statusCode).toBe(403);
  });

  it('POST scan materializes missing nextAt and clears expired snooze', async () => {
    const cookie = await ctx.loginAsScopeLead();
    const TS = Date.now();
    const blocks = emptyBlockDocumentJson();
    const publishedAt = new Date('2026-01-01T00:00:00.000Z');

    const missingNext = await prisma.$transaction(async (tx) => {
      const document = await tx.document.create({
        data: {
          title: `HC Missing Next ${TS}`,
          draftBlocks: blocks,
          contextId: ctx.contextId,
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
      return tx.document.update({
        where: { id: document.id },
        data: {
          publishedAt,
          currentPublishedVersionId: version.id,
          healthCheckNextAt: null,
          healthCheckSnoozedUntil: new Date('2020-06-01T00:00:00.000Z'),
        },
      });
    });

    const before = await prisma.document.findUniqueOrThrow({ where: { id: missingNext.id } });
    expect(before.healthCheckNextAt).toBeNull();
    expect(before.contextId).toBe(ctx.contextId);

    const scan = await adminApp.inject({
      method: 'POST',
      url: '/api/v1/me/freshness/scan',
      headers: { cookie, 'content-type': 'application/json' },
      payload: {},
    });
    expect(scan.statusCode).toBe(200);
    const scanBody = scan.json() as {
      scanned: number;
      updatedDocumentIds: string[];
      counts: { actionNeeded: number };
    };
    expect(scanBody.scanned).toBeGreaterThan(0);
    expect(scanBody.updatedDocumentIds).toContain(missingNext.id);

    const doc = await prisma.document.findUniqueOrThrow({ where: { id: missingNext.id } });
    expect(doc.healthCheckSnoozedUntil).toBeNull();
    expect(doc.healthCheckNextAt?.toISOString()).toBe(addDays(publishedAt, 90).toISOString());

    await prisma.documentHealthCheckEvent.deleteMany({ where: { documentId: missingNext.id } });
    await prisma.document.update({
      where: { id: missingNext.id },
      data: { currentPublishedVersionId: null, publishedAt: null },
    });
    await prisma.documentVersion.deleteMany({ where: { documentId: missingNext.id } });
    await prisma.document.delete({ where: { id: missingNext.id } });
  });

  it('still-valid / needs-update / archive update fields', async () => {
    const cookie = await ctx.loginAsScopeLead();

    const still = await adminApp.inject({
      method: 'POST',
      url: `/api/v1/documents/${dueDocId}/freshness/still-valid`,
      headers: { cookie, 'content-type': 'application/json' },
      payload: { intervalDays: 30 },
    });
    expect(still.statusCode).toBe(204);
    let doc = await prisma.document.findUniqueOrThrow({ where: { id: dueDocId } });
    expect(doc.healthCheckLastDecision).toBe('still_valid');
    expect(doc.healthCheckNeedsUpdate).toBe(false);
    expect(doc.healthCheckNeedsArchive).toBe(false);
    expect(doc.healthCheckNextAt).not.toBeNull();
    expect(doc.healthCheckSnoozedUntil).toBeNull();

    const needs = await adminApp.inject({
      method: 'POST',
      url: `/api/v1/documents/${dueDocId}/freshness/needs-update`,
      headers: { cookie },
    });
    expect(needs.statusCode).toBe(204);
    doc = await prisma.document.findUniqueOrThrow({ where: { id: dueDocId } });
    expect(doc.healthCheckNeedsUpdate).toBe(true);
    expect(doc.healthCheckNeedsArchive).toBe(false);

    const archive = await adminApp.inject({
      method: 'POST',
      url: `/api/v1/documents/${dueDocId}/freshness/archive`,
      headers: { cookie },
    });
    expect(archive.statusCode).toBe(204);
    doc = await prisma.document.findUniqueOrThrow({ where: { id: dueDocId } });
    expect(doc.healthCheckNeedsArchive).toBe(true);
    expect(doc.healthCheckNeedsUpdate).toBe(false);
    expect(doc.healthCheckLastDecision).toBe('archive');

    const archiveList = await adminApp.inject({
      method: 'GET',
      url: '/api/v1/me/freshness?reason=all&outcome=archive&limit=50',
      headers: { cookie },
    });
    expect(archiveList.statusCode).toBe(200);
    const archiveBody = archiveList.json() as { items: { documentId: string; outcome: string }[] };
    expect(archiveBody.items.map((i) => i.documentId)).toContain(dueDocId);
    expect(archiveBody.items.find((i) => i.documentId === dueDocId)?.outcome).toBe('archive');

    const nextAtBeforeClear = doc.healthCheckNextAt;
    const clear = await adminApp.inject({
      method: 'POST',
      url: `/api/v1/documents/${dueDocId}/freshness/clear-outcome`,
      headers: { cookie },
    });
    expect(clear.statusCode).toBe(204);
    doc = await prisma.document.findUniqueOrThrow({ where: { id: dueDocId } });
    expect(doc.healthCheckNeedsArchive).toBe(false);
    expect(doc.healthCheckNeedsUpdate).toBe(false);
    expect(doc.healthCheckNextAt?.toISOString()).toBe(nextAtBeforeClear?.toISOString());
  });

  it('GET /me capabilities: admin false', async () => {
    const adminLogin = await adminApp.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: adminEmail, password: PASSWORD },
    });
    const adminCookie = getCookieHeader(adminLogin.headers['set-cookie']);
    const res = await adminApp.inject({
      method: 'GET',
      url: '/api/v1/me',
      headers: { cookie: adminCookie },
    });
    expect(res.statusCode).toBe(200);
    expect(
      (res.json() as { capabilities: { healthCheck: boolean } }).capabilities.healthCheck
    ).toBe(false);
  });
});
