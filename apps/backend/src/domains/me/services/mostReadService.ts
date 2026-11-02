import type { PrismaClient } from '../../../../generated/prisma/client.js';
import {
  getContextIdsForScope,
  type ScopeRef,
} from '../../organisation/permissions/scopeResolution.js';
import { isScopeLead } from '../../organisation/permissions/scopeVisibility.js';
import { contextNameFromDoc, trashArchiveContextSelect } from '../routes/meTrashArchive.js';

export const MOST_READ_LIMIT = 10;

export type MostReadItem = {
  id: string;
  title: string;
  viewCount: number;
  contextName: string;
};

export type MostReadResult = { items: MostReadItem[] };

function personalDocumentOwnerOr(userId: string) {
  return [
    { context: { process: { owner: { ownerUserId: userId } } } },
    { context: { project: { owner: { ownerUserId: userId } } } },
    { context: { subcontext: { project: { owner: { ownerUserId: userId } } } } },
  ];
}

/**
 * Top published documents by all-time reader-days (`viewCount`) for a scope lead.
 * Non-leads get an empty list (no 403). Personal scope: owner sees own published docs.
 */
export async function getMostReadDocuments(
  prisma: PrismaClient,
  userId: string,
  scope: ScopeRef | { type: 'personal' }
): Promise<MostReadResult> {
  if (scope.type === 'personal') {
    const docs = await prisma.document.findMany({
      where: {
        publishedAt: { not: null },
        deletedAt: null,
        archivedAt: null,
        viewCount: { gt: 0 },
        OR: personalDocumentOwnerOr(userId),
      },
      select: {
        id: true,
        title: true,
        viewCount: true,
        ...trashArchiveContextSelect,
      },
      orderBy: [{ viewCount: 'desc' }, { publishedAt: 'desc' }],
      take: MOST_READ_LIMIT,
    });
    return {
      items: docs.map((doc) => ({
        id: doc.id,
        title: doc.title,
        viewCount: doc.viewCount,
        contextName: contextNameFromDoc(doc),
      })),
    };
  }

  const [scopeLead, scopeContextIds] = await Promise.all([
    isScopeLead(prisma, userId, scope),
    getContextIdsForScope(prisma, scope),
  ]);
  if (!scopeLead || scopeContextIds.length === 0) {
    return { items: [] };
  }

  const docs = await prisma.document.findMany({
    where: {
      publishedAt: { not: null },
      deletedAt: null,
      archivedAt: null,
      viewCount: { gt: 0 },
      contextId: { in: scopeContextIds },
    },
    select: {
      id: true,
      title: true,
      viewCount: true,
      ...trashArchiveContextSelect,
    },
    orderBy: [{ viewCount: 'desc' }, { publishedAt: 'desc' }],
    take: MOST_READ_LIMIT,
  });

  return {
    items: docs.map((doc) => ({
      id: doc.id,
      title: doc.title,
      viewCount: doc.viewCount,
      contextName: contextNameFromDoc(doc),
    })),
  };
}
