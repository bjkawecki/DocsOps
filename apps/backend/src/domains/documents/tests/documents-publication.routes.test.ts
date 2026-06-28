import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { GrantRole } from '../../../../generated/prisma/client.js';
import type { Prisma } from '../../../../generated/prisma/client.js';
import { prisma } from '../../../db.js';
import { exampleBlockDocumentV0 } from '../services/blocks/blockSchema.js';
import {
  createDocumentsTestContext,
  disposeDocumentsTestContext,
  type DocumentsTestContext,
} from './helpers/documentsTestContext.js';

describe('Documents routes / publication', () => {
  let context: DocumentsTestContext;

  beforeAll(async () => {
    context = await createDocumentsTestContext();
  });

  afterAll(async () => {
    await disposeDocumentsTestContext(context);
  });

  it('POST /documents/:documentId/publish ohne Auth -> 401', async () => {
    const res = await context.app.inject({
      method: 'POST',
      url: `/api/v1/documents/${context.draftDocId}/publish`,
    });
    expect(res.statusCode).toBe(401);
  });

  it('POST /documents/:documentId/publish als Scope-Lead -> 200', async () => {
    const cookie = await context.loginAsScopeLead();
    const res = await context.app.inject({
      method: 'POST',
      url: `/api/v1/documents/${context.draftDocId}/publish`,
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      publishedAt: string | null;
      currentPublishedVersionId: string | null;
    };
    expect(body.publishedAt).not.toBeNull();
    expect(body.currentPublishedVersionId).not.toBeNull();

    const doc = await prisma.document.findUnique({
      where: { id: context.draftDocId },
      select: { publishedAt: true, currentPublishedVersionId: true },
    });
    expect(doc?.publishedAt).not.toBeNull();
    expect(doc?.currentPublishedVersionId).not.toBeNull();

    const versions = await prisma.documentVersion.findMany({
      where: { documentId: context.draftDocId },
      select: { versionNumber: true },
    });
    expect(versions.some((version) => version.versionNumber === 1)).toBe(true);

    const afterPublish = await prisma.document.findUnique({
      where: { id: context.draftDocId },
      select: { draftRevision: true },
    });
    expect(afterPublish?.draftRevision).toBe(0);
  });

  it('POST /documents/:documentId/publish erneut mit geändertem Draft -> 200, Version 2', async () => {
    const cookie = await context.loginAsScopeLead();
    const revisionRow = await prisma.document.findUnique({
      where: { id: context.draftDocId },
      select: { draftRevision: true },
    });
    const draftBlocks = {
      schemaVersion: 0 as const,
      blocks: [
        {
          id: '550e8400-e29b-41d4-a716-446655440099',
          type: 'paragraph',
          content: [
            {
              id: '550e8400-e29b-41d4-a716-44665544009a',
              type: 'text',
              attrs: {},
              meta: { text: 'Updated for republish' },
            },
          ],
        },
      ],
    };
    const patchRes = await context.app.inject({
      method: 'PATCH',
      url: `/api/v1/documents/${context.draftDocId}/lead-draft`,
      headers: { cookie, 'content-type': 'application/json' },
      payload: {
        expectedRevision: revisionRow?.draftRevision ?? 0,
        blocks: draftBlocks,
      },
    });
    expect(patchRes.statusCode).toBe(200);

    const res = await context.app.inject({
      method: 'POST',
      url: `/api/v1/documents/${context.draftDocId}/publish`,
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);

    const versions = await prisma.documentVersion.findMany({
      where: { documentId: context.draftDocId },
      select: { versionNumber: true },
      orderBy: { versionNumber: 'asc' },
    });
    expect(versions.map((v) => v.versionNumber)).toEqual([1, 2]);

    const afterRepublish = await prisma.document.findUnique({
      where: { id: context.draftDocId },
      select: { draftRevision: true },
    });
    expect(afterRepublish?.draftRevision).toBe(0);
  });

  it('POST /documents/:documentId/publish ohne Draft-Änderung -> 400', async () => {
    const cookie = await context.loginAsScopeLead();
    const res = await context.app.inject({
      method: 'POST',
      url: `/api/v1/documents/${context.publishedDocId}/publish`,
      headers: { cookie },
    });
    expect(res.statusCode).toBe(400);
  });

  it('POST /documents/:documentId/publish mit pending suggestions -> 400', async () => {
    const cookie = await context.loginAsScopeLead();
    const draftWithSuggestion = {
      schemaVersion: 1 as const,
      blocks: [
        {
          id: 'p-pending-pub',
          type: 'paragraph',
          content: [
            {
              id: 'leaf-pending',
              type: 'text',
              attrs: {},
              meta: {
                text: 'pending insert',
                suggestion: {
                  id: 'pub-block-sugg',
                  kind: 'insert',
                  authorId: context.scopeAuthorId,
                  status: 'pending',
                  createdAt: '2026-06-16T12:00:00.000Z',
                },
              },
            },
          ],
        },
      ],
    };
    await prisma.document.update({
      where: { id: context.publishedDocId },
      data: {
        draftBlocks: draftWithSuggestion as unknown as Prisma.InputJsonValue,
        draftRevision: 0,
      },
    });
    const res = await context.app.inject({
      method: 'POST',
      url: `/api/v1/documents/${context.publishedDocId}/publish`,
      headers: { cookie },
    });
    expect(res.statusCode).toBe(400);
  });

  it('Publish nach accept aller suggestions: Version.blocks ohne meta.suggestion', async () => {
    const cookie = await context.loginAsScopeLead();
    const cleanDoc = structuredClone(exampleBlockDocumentV0);
    await prisma.document.update({
      where: { id: context.publishedDocId },
      data: {
        draftBlocks: cleanDoc as unknown as Prisma.InputJsonValue,
        draftRevision: 0,
      },
    });
    const patchRes = await context.app.inject({
      method: 'PATCH',
      url: `/api/v1/documents/${context.publishedDocId}/lead-draft`,
      headers: { cookie, 'content-type': 'application/json' },
      payload: JSON.stringify({ expectedRevision: 0, blocks: cleanDoc }),
    });
    expect(patchRes.statusCode).toBe(200);

    const publishRes = await context.app.inject({
      method: 'POST',
      url: `/api/v1/documents/${context.publishedDocId}/publish`,
      headers: { cookie },
    });
    expect(publishRes.statusCode).toBe(200);

    const version = await prisma.documentVersion.findFirst({
      where: { documentId: context.publishedDocId },
      orderBy: { versionNumber: 'desc' },
      select: { blocks: true },
    });
    const json = JSON.stringify(version?.blocks ?? {});
    expect(json).not.toContain('"suggestion"');
  });

  it('Publish mit Lead-Draft-Blocks: Version.blocks aus Draft', async () => {
    let ephemeralId: string | null = null;
    try {
      const document = await prisma.document.create({
        data: {
          title: `Publish from draft blocks ${Date.now()}`,
          contextId: context.contextId,
          draftBlocks: exampleBlockDocumentV0 as unknown as Prisma.InputJsonValue,
          draftRevision: 1,
        },
      });
      ephemeralId = document.id;
      await prisma.documentGrantUser.createMany({
        data: [{ documentId: ephemeralId, userId: context.writerId, role: GrantRole.Write }],
      });

      const cookie = await context.loginAsScopeLead();
      const res = await context.app.inject({
        method: 'POST',
        url: `/api/v1/documents/${ephemeralId}/publish`,
        headers: { cookie },
      });
      expect(res.statusCode).toBe(200);

      const versionOne = await prisma.documentVersion.findFirst({
        where: { documentId: ephemeralId, versionNumber: 1 },
        select: { blocks: true },
      });
      expect(JSON.parse(JSON.stringify(versionOne?.blocks))).toEqual(exampleBlockDocumentV0);
    } finally {
      if (ephemeralId) {
        await prisma.document.deleteMany({ where: { id: ephemeralId } });
      }
    }
  });
});
