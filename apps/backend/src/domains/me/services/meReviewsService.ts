import type { PrismaClient } from '../../../../generated/prisma/client.js';
import { draftOpsArraySchema } from '../../documents/services/collaboration/documentDraftOps.js';
import { getPublishableContextIds } from '../../organisation/permissions/catalogPermissions.js';
import { getScopeFromOwner, ownerScopeSelect } from '../routes/me/route-helpers.js';

const documentSelect = {
  id: true,
  title: true,
  contextId: true,
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

export type ReviewDraftChangeDocumentItem = {
  documentId: string;
  documentTitle: string;
  scopeType: 'team' | 'department' | 'company' | 'personal';
  scopeId: string | null;
  scopeName: string;
  changeCount: number;
  lastChangeAt: string;
  lastAuthorId: string;
  lastAuthorName: string | null;
  affectedBlockSummary: string | null;
};

export type ReviewMyDraftChangeItem = {
  changeId: string;
  documentId: string;
  documentTitle: string;
  scopeType: 'team' | 'department' | 'company' | 'personal';
  scopeId: string | null;
  scopeName: string;
  savedAt: string;
  revisionFrom: number;
  revisionTo: number;
  affectedBlockSummary: string | null;
};

export type MeReviewsResult = {
  pendingForReview: ReviewDraftChangeDocumentItem[];
  myChanges: ReviewMyDraftChangeItem[];
  totalPendingForReview: number;
  totalMyChanges: number;
  limit: number;
  offset: number;
};

const activeDocumentWhere = {
  deletedAt: null,
  archivedAt: null,
} as const;

function summarizeOps(ops: unknown, affectedBlockIds: string[]): string | null {
  const parsed = draftOpsArraySchema.safeParse(ops);
  if (parsed.success) {
    const parts = parsed.data.map((op) => {
      if (op.op === 'replaceBlock') return 'replace block';
      if (op.op === 'deleteBlock') return 'delete block';
      return 'insert block';
    });
    if (parts.length > 0) return parts.join(', ');
  }
  if (affectedBlockIds.length > 0) {
    return `${affectedBlockIds.length} block(s) changed`;
  }
  return null;
}

function scopeFromDocument(doc: DocumentWithScope) {
  const owner =
    doc.context?.process?.owner ??
    doc.context?.project?.owner ??
    doc.context?.subcontext?.project?.owner ??
    null;
  return getScopeFromOwner(owner);
}

type ChangeRow = {
  id: string;
  documentId: string;
  revisionFrom: number;
  revisionTo: number;
  savedAt: Date;
  savedById: string;
  ops: unknown;
  affectedBlockIds: string[];
  savedBy: { id: string; name: string | null };
  document: DocumentWithScope;
};

function aggregatePendingForReview(
  rows: ChangeRow[],
  limit: number,
  offset: number
): { items: ReviewDraftChangeDocumentItem[]; total: number } {
  const byDocument = new Map<
    string,
    {
      document: DocumentWithScope;
      changeCount: number;
      lastChange: ChangeRow;
    }
  >();

  for (const row of rows) {
    const existing = byDocument.get(row.documentId);
    if (!existing) {
      byDocument.set(row.documentId, {
        document: row.document,
        changeCount: 1,
        lastChange: row,
      });
      continue;
    }
    existing.changeCount += 1;
    if (row.savedAt > existing.lastChange.savedAt) {
      existing.lastChange = row;
    }
  }

  const sorted = [...byDocument.values()].sort(
    (a, b) => b.lastChange.savedAt.getTime() - a.lastChange.savedAt.getTime()
  );
  const total = sorted.length;
  const page = sorted.slice(offset, offset + limit);

  return {
    total,
    items: page.map(({ document, changeCount, lastChange }) => {
      const scope = scopeFromDocument(document);
      return {
        documentId: document.id,
        documentTitle: document.title,
        scopeType: scope.scopeType,
        scopeId: scope.scopeId,
        scopeName: scope.scopeName,
        changeCount,
        lastChangeAt: lastChange.savedAt.toISOString(),
        lastAuthorId: lastChange.savedById,
        lastAuthorName: lastChange.savedBy.name,
        affectedBlockSummary: summarizeOps(lastChange.ops, lastChange.affectedBlockIds),
      };
    }),
  };
}

function mapMyChangeRow(row: ChangeRow): ReviewMyDraftChangeItem {
  const scope = scopeFromDocument(row.document);
  return {
    changeId: row.id,
    documentId: row.documentId,
    documentTitle: row.document.title,
    scopeType: scope.scopeType,
    scopeId: scope.scopeId,
    scopeName: scope.scopeName,
    savedAt: row.savedAt.toISOString(),
    revisionFrom: row.revisionFrom,
    revisionTo: row.revisionTo,
    affectedBlockSummary: summarizeOps(row.ops, row.affectedBlockIds),
  };
}

const changeInclude = {
  savedBy: { select: { id: true, name: true } },
  document: { select: documentSelect },
} as const;

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

  const cycleDocumentFilter = {
    ...leadDocumentWhere,
    draftCycle: { isNot: null },
  };

  const [pendingChanges, myChanges, totalMyChanges] = await Promise.all([
    prisma.documentDraftChange.findMany({
      where: { document: cycleDocumentFilter },
      include: changeInclude,
      orderBy: { savedAt: 'desc' },
    }),
    prisma.documentDraftChange.findMany({
      where: {
        savedById: userId,
        document: {
          ...activeDocumentWhere,
          draftCycle: { isNot: null },
        },
      },
      include: changeInclude,
      orderBy: { savedAt: 'desc' },
      take: query.limit,
      skip: query.offset,
    }),
    prisma.documentDraftChange.count({
      where: {
        savedById: userId,
        document: {
          ...activeDocumentWhere,
          draftCycle: { isNot: null },
        },
      },
    }),
  ]);

  const pending = aggregatePendingForReview(
    pendingChanges as ChangeRow[],
    query.limit,
    query.offset
  );

  return {
    pendingForReview: pending.items,
    myChanges: (myChanges as ChangeRow[]).map(mapMyChangeRow),
    totalPendingForReview: pending.total,
    totalMyChanges,
    limit: query.limit,
    offset: query.offset,
  };
}
