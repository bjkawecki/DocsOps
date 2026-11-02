import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../../db.js';
import { hashPassword } from '../../auth/services/password.js';
import { emptyBlockDocumentJson } from '../../documents/services/blocks/documentBlocksBackfill.js';
import { pruneDeletedDocumentsFromRecentItemsByScope } from './pruneRecentDeletedDocuments.js';

const TS = `prune-recent-${Date.now()}`;

describe('pruneDeletedDocumentsFromRecentItemsByScope', () => {
  let userId: string;
  let activeDocId: string;
  let deletedDocId: string;

  beforeAll(async () => {
    const pw = await hashPassword('testpass12');
    const user = await prisma.user.create({
      data: { name: 'Prune Recent', email: `${TS}@example.com`, passwordHash: pw },
    });
    userId = user.id;
    const active = await prisma.document.create({
      data: {
        title: 'Active',
        createdById: userId,
        draftBlocks: emptyBlockDocumentJson(),
      },
    });
    activeDocId = active.id;
    const deleted = await prisma.document.create({
      data: {
        title: 'Trashed',
        createdById: userId,
        draftBlocks: emptyBlockDocumentJson(),
        deletedAt: new Date(),
      },
    });
    deletedDocId = deleted.id;
  });

  afterAll(async () => {
    await prisma.document.deleteMany({ where: { id: { in: [activeDocId, deletedDocId] } } });
    await prisma.session.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { id: userId } });
  });

  it('removes soft-deleted and missing document ids; keeps process and active docs', async () => {
    const { pruned, changed } = await pruneDeletedDocumentsFromRecentItemsByScope(prisma, {
      personal: [
        { type: 'document', id: deletedDocId, name: 'Trashed' },
        { type: 'document', id: activeDocId, name: 'Active' },
        { type: 'document', id: 'missing-doc-id', name: 'Gone' },
        { type: 'process', id: 'proc-1', name: 'Process' },
      ],
    });

    expect(changed).toBe(true);
    expect(pruned?.personal).toEqual([
      { type: 'document', id: activeDocId, name: 'Active' },
      { type: 'process', id: 'proc-1', name: 'Process' },
    ]);
  });

  it('reports unchanged when nothing to prune', async () => {
    const input = {
      personal: [{ type: 'document' as const, id: activeDocId, name: 'Active' }],
    };
    const { pruned, changed } = await pruneDeletedDocumentsFromRecentItemsByScope(prisma, input);
    expect(changed).toBe(false);
    expect(pruned).toEqual(input);
  });
});
