import type { PrismaClient } from '../../../../generated/prisma/client.js';
import { parseBlockDocumentFromDb } from '../../documents/services/blocks/documentBlocksBackfill.js';
import { summarizePendingSuggestions } from '../../documents/services/collaboration/draftInlineSuggestions.js';
import { getPublishableContextIds } from '../../organisation/permissions/catalogPermissions.js';
import { getScopeFromOwner, ownerScopeSelect } from '../routes/me/route-helpers.js';

const documentSelect = {
  id: true,
  title: true,
  contextId: true,
  draftBlocks: true,
  context: {
    select: {
      process: { select: { owner: { select: ownerScopeSelect } } },
      project: { select: { owner: { select: ownerScopeSelect } } },
      subcontext: {
        select: { project: { select: { owner: { select: ownerScopeSelect } } } },
      },
    },
  },
} as const;

type DocumentWithScope = {
  id: string;
  title: string;
  contextId: string | null;
  draftBlocks: unknown;
  context: {
    process: { owner: Parameters<typeof getScopeFromOwner>[0] } | null;
    project: { owner: Parameters<typeof getScopeFromOwner>[0] } | null;
    subcontext: { project: { owner: Parameters<typeof getScopeFromOwner>[0] } } | null;
  } | null;
};

export type MeReviewsQuery = {
  limit: number;
  offset: number;
};

export type ReviewPendingSuggestionsItem = {
  documentId: string;
  documentTitle: string;
  scopeType: 'team' | 'department' | 'company' | 'personal';
  scopeId: string | null;
  scopeName: string;
  pendingSuggestionCount: number;
  lastSuggestionAt: string | null;
  authorIds: string[];
};

export type MeReviewsResult = {
  pendingForReview: ReviewPendingSuggestionsItem[];
  totalPendingForReview: number;
  limit: number;
  offset: number;
};

const activeDocumentWhere = {
  deletedAt: null,
  archivedAt: null,
} as const;

function scopeFromDocument(doc: DocumentWithScope) {
  const owner =
    doc.context?.process?.owner ??
    doc.context?.project?.owner ??
    doc.context?.subcontext?.project?.owner ??
    null;
  return getScopeFromOwner(owner);
}

function mapDocumentToReviewItem(doc: DocumentWithScope): ReviewPendingSuggestionsItem | null {
  const parsed = parseBlockDocumentFromDb(doc.draftBlocks);
  if (!parsed) return null;
  const summary = summarizePendingSuggestions(parsed);
  if (summary.pendingSuggestionCount === 0) return null;
  const scope = scopeFromDocument(doc);
  return {
    documentId: doc.id,
    documentTitle: doc.title,
    scopeType: scope.scopeType,
    scopeId: scope.scopeId,
    scopeName: scope.scopeName,
    pendingSuggestionCount: summary.pendingSuggestionCount,
    lastSuggestionAt: summary.lastSuggestionAt,
    authorIds: summary.authorIds,
  };
}

export async function listMeReviews(
  prisma: PrismaClient,
  userId: string,
  query: MeReviewsQuery
): Promise<MeReviewsResult> {
  const { isAdmin, contextIds } = await getPublishableContextIds(prisma, userId);

  const leadDocumentWhere = isAdmin
    ? activeDocumentWhere
    : contextIds.length > 0
      ? { ...activeDocumentWhere, contextId: { in: contextIds } }
      : { id: { in: [] as string[] } };

  const documents = await prisma.document.findMany({
    where: leadDocumentWhere,
    select: documentSelect,
    orderBy: { updatedAt: 'desc' },
  });

  const items = (documents as DocumentWithScope[])
    .map(mapDocumentToReviewItem)
    .filter((item): item is ReviewPendingSuggestionsItem => item != null)
    .sort((a, b) => {
      const aTime = a.lastSuggestionAt ?? '';
      const bTime = b.lastSuggestionAt ?? '';
      return bTime.localeCompare(aTime);
    });

  const total = items.length;
  const page = items.slice(query.offset, query.offset + query.limit);

  return {
    pendingForReview: page,
    totalPendingForReview: total,
    limit: query.limit,
    offset: query.offset,
  };
}
