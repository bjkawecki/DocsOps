import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Prisma } from '../../../../generated/prisma/client.js';
import { prisma } from '../../../db.js';
import { exampleBlockDocumentV0 } from '../services/blocks/blockSchema.js';
import {
  createDocumentsTestContext,
  disposeDocumentsTestContext,
  type DocumentsTestContext,
} from './helpers/documentsTestContext.js';

function docWithInsertSuggestion(authorId: string, suggestionId: string) {
  const doc = structuredClone(exampleBlockDocumentV0);
  const block = doc.blocks[0];
  if (block) {
    block.content = [
      ...(block.content ?? []),
      {
        id: 'sugg-leaf-1',
        type: 'text',
        attrs: {},
        meta: {
          text: ' suggested',
          suggestion: {
            id: suggestionId,
            kind: 'insert',
            authorId,
            status: 'pending',
            createdAt: '2026-06-16T12:00:00.000Z',
          },
        },
      },
    ];
  }
  return doc;
}

describe('Documents routes / draft suggestions', () => {
  let context: DocumentsTestContext;
  const suggestionId = 'sugg-route-test-1';

  beforeAll(async () => {
    context = await createDocumentsTestContext();
    await prisma.document.update({
      where: { id: context.publishedDocId },
      data: {
        draftBlocks: docWithInsertSuggestion(
          context.scopeAuthorId,
          suggestionId
        ) as unknown as Prisma.InputJsonValue,
        draftRevision: 0,
      },
    });
  });

  afterAll(async () => {
    await disposeDocumentsTestContext(context);
  });

  it('POST accept as lead -> 200, pendingSuggestionCount decreases', async () => {
    const cookie = await context.loginAsScopeLead();
    const res = await context.app.inject({
      method: 'POST',
      url: `/api/v1/documents/${context.publishedDocId}/draft/suggestions/${suggestionId}/accept`,
      headers: { cookie, 'content-type': 'application/json' },
      payload: JSON.stringify({ expectedRevision: 0 }),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { pendingSuggestionCount: number; draftRevision: number };
    expect(body.pendingSuggestionCount).toBe(0);
    expect(body.draftRevision).toBe(1);
  });

  it('POST decline on missing suggestion -> 404', async () => {
    const cookie = await context.loginAsScopeLead();
    const res = await context.app.inject({
      method: 'POST',
      url: `/api/v1/documents/${context.publishedDocId}/draft/suggestions/missing-id/decline`,
      headers: { cookie, 'content-type': 'application/json' },
      payload: JSON.stringify({ expectedRevision: 1 }),
    });
    expect(res.statusCode).toBe(404);
  });

  it('author withdraw after re-adding suggestion -> 200', async () => {
    await prisma.document.update({
      where: { id: context.publishedDocId },
      data: {
        draftBlocks: docWithInsertSuggestion(
          context.scopeAuthorId,
          'sugg-withdraw-1'
        ) as unknown as Prisma.InputJsonValue,
        draftRevision: 1,
      },
    });
    const cookie = await context.loginAsScopeAuthor();
    const res = await context.app.inject({
      method: 'DELETE',
      url: `/api/v1/documents/${context.publishedDocId}/draft/suggestions/sugg-withdraw-1`,
      headers: { cookie, 'content-type': 'application/json' },
      payload: JSON.stringify({ expectedRevision: 1 }),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { pendingSuggestionCount: number };
    expect(body.pendingSuggestionCount).toBe(0);
  });
});
