import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import type { Prisma } from '../../../../generated/prisma/client.js';
import { prisma } from '../../../db.js';
import * as liveEventNotify from '../../../infrastructure/liveEvents/liveEventNotify.js';
import { exampleBlockDocumentV0 } from '../services/blocks/blockSchema.js';
import {
  createDocumentsTestContext,
  disposeDocumentsTestContext,
  type DocumentsTestContext,
} from './helpers/documentsTestContext.js';

describe('Documents routes / suggestions', () => {
  let context: DocumentsTestContext;

  beforeAll(async () => {
    context = await createDocumentsTestContext();
    await prisma.document.update({
      where: { id: context.publishedDocId },
      data: {
        draftBlocks: exampleBlockDocumentV0 as unknown as Prisma.InputJsonValue,
        draftRevision: 0,
      },
    });
  });

  afterAll(async () => {
    await disposeDocumentsTestContext(context);
  });

  it('Read-only GET suggestions -> 403', async () => {
    const cookie = await context.loginAsReaderOnly();
    const res = await context.app.inject({
      method: 'GET',
      url: `/api/v1/documents/${context.publishedDocId}/suggestions`,
      headers: { cookie },
    });
    expect(res.statusCode).toBe(403);
  });

  it('Writer GET suggestions -> 200', async () => {
    const cookie = await context.loginAsWriter();
    const res = await context.app.inject({
      method: 'GET',
      url: `/api/v1/documents/${context.publishedDocId}/suggestions`,
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json())).toBe(true);
  });

  it('Writer POST mit falscher baseDraftRevision -> 409', async () => {
    const cookie = await context.loginAsWriter();
    const res = await context.app.inject({
      method: 'POST',
      url: `/api/v1/documents/${context.publishedDocId}/suggestions`,
      headers: { cookie, 'content-type': 'application/json' },
      payload: JSON.stringify({
        baseDraftRevision: 99_999,
        ops: [{ op: 'deleteBlock', blockId: '550e8400-e29b-41d4-a716-446655440002' }],
      }),
    });
    expect(res.statusCode).toBe(409);
    const body = res.json() as { code?: string };
    expect(body.code).toBe('stale_suggestion');
  });

  it('Writer POST Suggestion emits document.collaboration-changed live event', async () => {
    const notifySpy = vi.spyOn(liveEventNotify, 'notifyLiveEvent').mockResolvedValue();
    const revisionRow = await prisma.document.findUnique({
      where: { id: context.publishedDocId },
      select: { draftRevision: true },
    });
    const cookie = await context.loginAsWriter();
    const res = await context.app.inject({
      method: 'POST',
      url: `/api/v1/documents/${context.publishedDocId}/suggestions`,
      headers: { cookie, 'content-type': 'application/json' },
      payload: JSON.stringify({
        baseDraftRevision: revisionRow!.draftRevision,
        ops: [{ op: 'deleteBlock', blockId: '550e8400-e29b-41d4-a716-446655440001' }],
      }),
    });
    expect(res.statusCode).toBe(201);
    await vi.waitFor(() => expect(notifySpy.mock.calls.length).toBeGreaterThan(0));
    const collaborationCalls = notifySpy.mock.calls.filter((call) => {
      const envelope = call[1] as { event?: { type?: string } };
      return envelope.event?.type === 'document.collaboration-changed';
    });
    expect(collaborationCalls.length).toBeGreaterThan(0);
    const envelope = collaborationCalls[0]![1] as {
      target: string;
      userId?: string;
      event: { payload: { documentId: string } };
    };
    expect(envelope.target).toBe('user');
    expect(envelope.event.payload.documentId).toBe(context.publishedDocId);
    expect(envelope.userId).not.toBe(context.writerId);
    notifySpy.mockRestore();
  });

  it('Writer POST gueltige Suggestion -> 201; withdraw -> 200', async () => {
    const revisionRow = await prisma.document.findUnique({
      where: { id: context.publishedDocId },
      select: { draftRevision: true },
    });
    const cookie = await context.loginAsWriter();
    const create = await context.app.inject({
      method: 'POST',
      url: `/api/v1/documents/${context.publishedDocId}/suggestions`,
      headers: { cookie, 'content-type': 'application/json' },
      payload: JSON.stringify({
        baseDraftRevision: revisionRow!.draftRevision,
        ops: [{ op: 'deleteBlock', blockId: '550e8400-e29b-41d4-a716-446655440002' }],
      }),
    });
    expect(create.statusCode).toBe(201);
    const created = create.json() as { id: string; status: string };
    expect(created.status).toBe('pending');

    const withdraw = await context.app.inject({
      method: 'POST',
      url: `/api/v1/documents/${context.publishedDocId}/suggestions/${created.id}/withdraw`,
      headers: { cookie },
    });
    expect(withdraw.statusCode).toBe(200);
    const after = withdraw.json() as { status: string };
    expect(after.status).toBe('withdrawn');
  });

  it('Lead accept wendet Ops an und erhoeht draftRevision', async () => {
    const revisionRow = await prisma.document.findUnique({
      where: { id: context.publishedDocId },
      select: { draftRevision: true },
    });
    const writerCookie = await context.loginAsWriter();
    const create = await context.app.inject({
      method: 'POST',
      url: `/api/v1/documents/${context.publishedDocId}/suggestions`,
      headers: { cookie: writerCookie, 'content-type': 'application/json' },
      payload: JSON.stringify({
        baseDraftRevision: revisionRow!.draftRevision,
        ops: [{ op: 'deleteBlock', blockId: '550e8400-e29b-41d4-a716-446655440002' }],
      }),
    });
    expect(create.statusCode).toBe(201);
    const suggestionId = (create.json() as { id: string }).id;

    const leadCookie = await context.loginAsScopeLead();
    const accept = await context.app.inject({
      method: 'POST',
      url: `/api/v1/documents/${context.publishedDocId}/suggestions/${suggestionId}/accept`,
      headers: { cookie: leadCookie, 'content-type': 'application/json' },
      payload: JSON.stringify({ comment: 'OK' }),
    });
    expect(accept.statusCode).toBe(200);
    const body = accept.json() as {
      draftRevision: number;
      suggestion: { status: string };
      blocks: { blocks: { id: string }[] };
    };
    expect(body.suggestion.status).toBe('accepted');
    expect(body.draftRevision).toBe(revisionRow!.draftRevision + 1);
    expect(body.blocks.blocks.map((block) => block.id)).not.toContain(
      '550e8400-e29b-41d4-a716-446655440002'
    );
  });

  it('Lead reject pending -> 200', async () => {
    const revisionRow = await prisma.document.findUnique({
      where: { id: context.publishedDocId },
      select: { draftRevision: true },
    });
    const writerCookie = await context.loginAsWriter();
    const create = await context.app.inject({
      method: 'POST',
      url: `/api/v1/documents/${context.publishedDocId}/suggestions`,
      headers: { cookie: writerCookie, 'content-type': 'application/json' },
      payload: JSON.stringify({
        baseDraftRevision: revisionRow!.draftRevision,
        ops: [
          {
            op: 'insertAfter',
            afterBlockId: '550e8400-e29b-41d4-a716-446655440000',
            blocks: [
              {
                id: 'reject-test-block',
                type: 'paragraph',
                content: [
                  {
                    id: 'reject-test-text',
                    type: 'text',
                    attrs: {},
                    meta: { text: 'x' },
                  },
                ],
              },
            ],
          },
        ],
      }),
    });
    expect(create.statusCode).toBe(201);
    const suggestionId = (create.json() as { id: string }).id;

    const leadCookie = await context.loginAsScopeLead();
    const reject = await context.app.inject({
      method: 'POST',
      url: `/api/v1/documents/${context.publishedDocId}/suggestions/${suggestionId}/reject`,
      headers: { cookie: leadCookie, 'content-type': 'application/json' },
      payload: JSON.stringify({ comment: 'Passt nicht' }),
    });
    expect(reject.statusCode).toBe(200);
    const body = reject.json() as { status: string; comment: string | null };
    expect(body.status).toBe('rejected');
    expect(body.comment).toBe('Passt nicht');
  });
});
