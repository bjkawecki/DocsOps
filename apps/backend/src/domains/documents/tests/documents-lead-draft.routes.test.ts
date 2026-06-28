import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../../db.js';
import { exampleBlockDocumentV0, type BlockDocument } from '../services/blocks/blockSchema.js';
import {
  createDocumentsTestContext,
  disposeDocumentsTestContext,
  type DocumentsTestContext,
} from './helpers/documentsTestContext.js';

describe('Documents routes / lead-draft', () => {
  let context: DocumentsTestContext;

  beforeAll(async () => {
    context = await createDocumentsTestContext();
  });

  afterAll(async () => {
    await disposeDocumentsTestContext(context);
  });

  it('GET /documents/:documentId/lead-draft ohne Auth -> 401', async () => {
    const res = await context.app.inject({
      method: 'GET',
      url: `/api/v1/documents/${context.publishedDocId}/lead-draft`,
    });
    expect(res.statusCode).toBe(401);
  });

  it('Read-only GET lead-draft -> 403', async () => {
    const cookie = await context.loginAsReaderOnly();
    const res = await context.app.inject({
      method: 'GET',
      url: `/api/v1/documents/${context.publishedDocId}/lead-draft`,
      headers: { cookie },
    });
    expect(res.statusCode).toBe(403);
  });

  it('Writer with grant but not scope author GET lead-draft -> 403', async () => {
    const cookie = await context.loginAsWriter();
    const res = await context.app.inject({
      method: 'GET',
      url: `/api/v1/documents/${context.publishedDocId}/lead-draft`,
      headers: { cookie },
    });
    expect(res.statusCode).toBe(403);
  });

  it('Scope-Lead GET lead-draft -> 200, canEdit true', async () => {
    const cookie = await context.loginAsScopeLead();
    const res = await context.app.inject({
      method: 'GET',
      url: `/api/v1/documents/${context.publishedDocId}/lead-draft`,
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { canEdit: boolean };
    expect(body.canEdit).toBe(true);
  });

  it('Writer PATCH lead-draft -> 403', async () => {
    const cookie = await context.loginAsWriter();
    const res = await context.app.inject({
      method: 'PATCH',
      url: `/api/v1/documents/${context.publishedDocId}/lead-draft`,
      headers: { cookie, 'content-type': 'application/json' },
      payload: JSON.stringify({
        expectedRevision: 0,
        blocks: exampleBlockDocumentV0,
      }),
    });
    expect(res.statusCode).toBe(403);
  });

  it('Scope author GET lead-draft -> 200, canEdit true', async () => {
    const cookie = await context.loginAsScopeAuthor();
    const res = await context.app.inject({
      method: 'GET',
      url: `/api/v1/documents/${context.publishedDocId}/lead-draft`,
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { canEdit: boolean };
    expect(body.canEdit).toBe(true);
  });

  it('Scope author PATCH lead-draft with suggestion -> 200', async () => {
    const cookie = await context.loginAsScopeAuthor();
    const getRes = await context.app.inject({
      method: 'GET',
      url: `/api/v1/documents/${context.publishedDocId}/lead-draft`,
      headers: { cookie },
    });
    expect(getRes.statusCode).toBe(200);
    const current = getRes.json() as { blocks: BlockDocument; draftRevision: number };
    const withSuggestion = structuredClone(current.blocks);
    withSuggestion.schemaVersion = 1;
    const block = withSuggestion.blocks[0];
    if (block && (block.type === 'paragraph' || block.type === 'heading')) {
      block.content = [
        ...(block.content ?? []),
        {
          id: 'author-sugg-leaf',
          type: 'text',
          attrs: {},
          meta: {
            text: ' author insert',
            suggestion: {
              id: 'author-sugg-1',
              kind: 'insert',
              authorId: context.scopeAuthorId,
              status: 'pending',
              createdAt: '2026-06-16T10:00:00.000Z',
            },
          },
        },
      ];
    }
    const res = await context.app.inject({
      method: 'PATCH',
      url: `/api/v1/documents/${context.publishedDocId}/lead-draft`,
      headers: { cookie, 'content-type': 'application/json' },
      payload: JSON.stringify({
        expectedRevision: current.draftRevision,
        blocks: withSuggestion,
      }),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { pendingSuggestionCount: number };
    expect(body.pendingSuggestionCount).toBeGreaterThanOrEqual(1);
  });

  it('Scope author PATCH new paragraph block with insert suggestion -> 200', async () => {
    const cookie = await context.loginAsScopeAuthor();
    const getRes = await context.app.inject({
      method: 'GET',
      url: `/api/v1/documents/${context.publishedDocId}/lead-draft`,
      headers: { cookie },
    });
    expect(getRes.statusCode).toBe(200);
    const current = getRes.json() as { blocks: BlockDocument; draftRevision: number };
    const withNewPara = structuredClone(current.blocks);
    withNewPara.schemaVersion = 1;
    withNewPara.blocks = [
      ...(withNewPara.blocks ?? []),
      {
        id: 'author-new-para',
        type: 'paragraph',
        content: [
          {
            id: 'author-new-leaf',
            type: 'text',
            attrs: {},
            meta: {
              text: 'Neuer Absatz',
              suggestion: {
                id: 'author-new-sugg',
                kind: 'insert',
                authorId: context.scopeAuthorId,
                status: 'pending',
                createdAt: '2026-06-16T10:00:00.000Z',
              },
            },
          },
        ],
      },
    ];
    const res = await context.app.inject({
      method: 'PATCH',
      url: `/api/v1/documents/${context.publishedDocId}/lead-draft`,
      headers: { cookie, 'content-type': 'application/json' },
      payload: JSON.stringify({
        expectedRevision: current.draftRevision,
        blocks: withNewPara,
      }),
    });
    expect(res.statusCode).toBe(200);
  });

  it('Scope author PATCH canon change without suggestion -> 400', async () => {
    const cookie = await context.loginAsScopeAuthor();
    const getRes = await context.app.inject({
      method: 'GET',
      url: `/api/v1/documents/${context.publishedDocId}/lead-draft`,
      headers: { cookie },
    });
    expect(getRes.statusCode).toBe(200);
    const current = getRes.json() as { blocks: BlockDocument; draftRevision: number };
    const modified = structuredClone(current.blocks);
    const block = modified.blocks[0];
    if (block?.content?.[0]?.meta) {
      block.content[0].meta = { text: 'Canon changed' };
    }
    const res = await context.app.inject({
      method: 'PATCH',
      url: `/api/v1/documents/${context.publishedDocId}/lead-draft`,
      headers: { cookie, 'content-type': 'application/json' },
      payload: JSON.stringify({
        expectedRevision: current.draftRevision,
        blocks: modified,
      }),
    });
    expect(res.statusCode).toBe(400);
  });

  it('Lead PATCH mit falscher expectedRevision -> 409', async () => {
    const cookie = await context.loginAsScopeLead();
    const res = await context.app.inject({
      method: 'PATCH',
      url: `/api/v1/documents/${context.publishedDocId}/lead-draft`,
      headers: { cookie, 'content-type': 'application/json' },
      payload: JSON.stringify({
        expectedRevision: 99,
        blocks: exampleBlockDocumentV0,
      }),
    });
    expect(res.statusCode).toBe(409);
  });

  it('Lead PATCH expectedRevision 1 with content change -> 200, Revision 2', async () => {
    const modified = structuredClone(exampleBlockDocumentV0);
    modified.blocks[0] = {
      ...modified.blocks[0],
      content: [{ id: 't-lead', type: 'text', meta: { text: 'Lead edit' } }],
    };
    const cookie = await context.loginAsScopeLead();
    const res = await context.app.inject({
      method: 'PATCH',
      url: `/api/v1/documents/${context.publishedDocId}/lead-draft`,
      headers: { cookie, 'content-type': 'application/json' },
      payload: JSON.stringify({
        expectedRevision: 1,
        blocks: modified,
      }),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { draftRevision: number };
    expect(body.draftRevision).toBe(2);
  });

  it('Lead PATCH stale expectedRevision 1 -> 409', async () => {
    const cookie = await context.loginAsScopeLead();
    const res = await context.app.inject({
      method: 'PATCH',
      url: `/api/v1/documents/${context.publishedDocId}/lead-draft`,
      headers: { cookie, 'content-type': 'application/json' },
      payload: JSON.stringify({
        expectedRevision: 1,
        blocks: exampleBlockDocumentV0,
      }),
    });
    expect(res.statusCode).toBe(409);
  });

  it('PATCH mit widersprüchlichem If-Match zu expectedRevision -> 400', async () => {
    const cookie = await context.loginAsScopeLead();
    const res = await context.app.inject({
      method: 'PATCH',
      url: `/api/v1/documents/${context.publishedDocId}/lead-draft`,
      headers: {
        cookie,
        'content-type': 'application/json',
        'if-match': '"0"',
      },
      payload: JSON.stringify({
        expectedRevision: 1,
        blocks: exampleBlockDocumentV0,
      }),
    });
    expect(res.statusCode).toBe(400);
  });

  it('PATCH overlapping delete spans -> 409 SUGGESTION_DELETE_OVERLAP', async () => {
    const revisionRow = await prisma.document.findUnique({
      where: { id: context.publishedDocId },
      select: { draftRevision: true },
    });
    const cookie = await context.loginAsScopeLead();
    const withOverlap: BlockDocument = {
      schemaVersion: 1,
      blocks: [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          type: 'paragraph',
          content: [
            {
              id: 'del-a',
              type: 'text',
              attrs: {},
              meta: {
                text: 'a',
                suggestion: {
                  id: 'overlap-s1',
                  kind: 'delete',
                  authorId: context.scopeAuthorId,
                  status: 'pending',
                  createdAt: '2026-06-16T10:00:00.000Z',
                },
              },
            },
            {
              id: 'del-b',
              type: 'text',
              attrs: {},
              meta: {
                text: 'b',
                suggestion: {
                  id: 'overlap-s2',
                  kind: 'delete',
                  authorId: context.writerId,
                  status: 'pending',
                  createdAt: '2026-06-16T10:01:00.000Z',
                },
              },
            },
            {
              id: 'del-c',
              type: 'text',
              attrs: {},
              meta: {
                text: 'b',
                suggestion: {
                  id: 'overlap-s1',
                  kind: 'delete',
                  authorId: context.scopeAuthorId,
                  status: 'pending',
                  createdAt: '2026-06-16T10:00:00.000Z',
                },
              },
            },
            {
              id: 'del-d',
              type: 'text',
              attrs: {},
              meta: {
                text: 'c',
                suggestion: {
                  id: 'overlap-s2',
                  kind: 'delete',
                  authorId: context.writerId,
                  status: 'pending',
                  createdAt: '2026-06-16T10:01:00.000Z',
                },
              },
            },
          ],
        },
      ],
    };
    const res = await context.app.inject({
      method: 'PATCH',
      url: `/api/v1/documents/${context.publishedDocId}/lead-draft`,
      headers: { cookie, 'content-type': 'application/json' },
      payload: JSON.stringify({
        expectedRevision: revisionRow?.draftRevision ?? 0,
        blocks: withOverlap,
      }),
    });
    expect(res.statusCode).toBe(409);
    const body = res.json() as { code?: string };
    expect(body.code).toBe('SUGGESTION_DELETE_OVERLAP');
  });

  it('PATCH mit expectedRevision 2 and content change -> 200, Revision 3', async () => {
    const modified = structuredClone(exampleBlockDocumentV0);
    modified.blocks[0] = {
      ...modified.blocks[0],
      content: [{ id: 't-lead-2', type: 'text', meta: { text: 'Lead edit 2' } }],
    };
    const cookie = await context.loginAsScopeLead();
    const res = await context.app.inject({
      method: 'PATCH',
      url: `/api/v1/documents/${context.publishedDocId}/lead-draft`,
      headers: { cookie, 'content-type': 'application/json' },
      payload: JSON.stringify({
        expectedRevision: 2,
        blocks: modified,
      }),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { draftRevision: number };
    expect(body.draftRevision).toBe(3);
  });
});
