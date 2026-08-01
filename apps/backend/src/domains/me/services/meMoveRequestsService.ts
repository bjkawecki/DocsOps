import type { PrismaClient } from '../../../../generated/prisma/client.js';
import { getPublishableContextIds } from '../../organisation/permissions/catalogPermissions.js';
import { getScopeFromOwner, ownerScopeSelect } from '../routes/me/route-helpers.js';

export type MeMoveRequestsQuery = {
  direction: 'inbound' | 'outbound';
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  limit: number;
  offset: number;
};

export type MeMoveRequestItem = {
  id: string;
  documentId: string;
  documentTitle: string;
  fromContextId: string;
  toContextId: string;
  fromOwnerId: string;
  toOwnerId: string;
  status: string;
  note: string | null;
  decisionNote: string | null;
  requestedById: string;
  requestedByName: string | null;
  decidedById: string | null;
  createdAt: string;
  decidedAt: string | null;
  fromScopeName: string;
  toScopeName: string;
  canAccept: boolean;
  canReject: boolean;
  canWithdraw: boolean;
};

export type MeMoveRequestsResult = {
  items: MeMoveRequestItem[];
  total: number;
  limit: number;
  offset: number;
  direction: 'inbound' | 'outbound';
  status: string;
};

const ownerSelect = { select: ownerScopeSelect } as const;

const contextOwnerInclude = {
  process: { select: { name: true, owner: ownerSelect } },
  project: { select: { name: true, owner: ownerSelect } },
  subcontext: {
    select: {
      name: true,
      project: { select: { name: true, owner: ownerSelect } },
    },
  },
} as const;

type ContextWithOwner = {
  process: { name: string; owner: Parameters<typeof getScopeFromOwner>[0] } | null;
  project: { name: string; owner: Parameters<typeof getScopeFromOwner>[0] } | null;
  subcontext: {
    name: string;
    project: { name: string; owner: Parameters<typeof getScopeFromOwner>[0] };
  } | null;
} | null;

function scopeNameFromContext(ctx: ContextWithOwner): string {
  const owner =
    ctx?.process?.owner ?? ctx?.project?.owner ?? ctx?.subcontext?.project?.owner ?? null;
  const scope = getScopeFromOwner(owner);
  const contextName =
    ctx?.process?.name ??
    ctx?.project?.name ??
    (ctx?.subcontext ? `${ctx.subcontext.project.name} / ${ctx.subcontext.name}` : null);
  if (contextName && scope.scopeName) return `${scope.scopeName}: ${contextName}`;
  return contextName ?? scope.scopeName ?? 'Unknown';
}

/**
 * Lists move requests for the Approvals hub (inbound decisions or outbound withdraw).
 */
export async function listMeMoveRequests(
  prisma: PrismaClient,
  userId: string,
  query: MeMoveRequestsQuery
): Promise<MeMoveRequestsResult> {
  const { isAdmin, contextIds } = await getPublishableContextIds(prisma, userId);

  const status = query.status;
  const where =
    query.direction === 'inbound'
      ? isAdmin
        ? { status }
        : contextIds.length > 0
          ? {
              status,
              toContextId: { in: contextIds },
            }
          : {
              status,
              id: { in: [] },
            }
      : isAdmin
        ? { status }
        : contextIds.length > 0
          ? {
              status,
              OR: [{ fromContextId: { in: contextIds } }, { requestedById: userId }],
            }
          : {
              status,
              requestedById: userId,
            };

  const [rows, total] = await Promise.all([
    prisma.documentMoveRequest.findMany({
      where,
      include: {
        document: { select: { id: true, title: true, deletedAt: true } },
        requestedBy: { select: { id: true, name: true } },
        fromContext: { select: contextOwnerInclude },
        toContext: { select: contextOwnerInclude },
      },
      orderBy: { createdAt: 'desc' },
      take: query.limit,
      skip: query.offset,
    }),
    prisma.documentMoveRequest.count({ where }),
  ]);

  const items: MeMoveRequestItem[] = rows
    .filter((row) => row.document.deletedAt == null)
    .map((row) => {
      const canDecide =
        query.direction === 'inbound' &&
        query.status === 'pending' &&
        (isAdmin || contextIds.includes(row.toContextId));
      const canWithdraw =
        query.direction === 'outbound' &&
        query.status === 'pending' &&
        (isAdmin || contextIds.includes(row.fromContextId) || row.requestedById === userId);
      return {
        id: row.id,
        documentId: row.documentId,
        documentTitle: row.document.title,
        fromContextId: row.fromContextId,
        toContextId: row.toContextId,
        fromOwnerId: row.fromOwnerId,
        toOwnerId: row.toOwnerId,
        status: row.status,
        note: row.note,
        decisionNote: row.decisionNote,
        requestedById: row.requestedById,
        requestedByName: row.requestedBy.name,
        decidedById: row.decidedById,
        createdAt: row.createdAt.toISOString(),
        decidedAt: row.decidedAt?.toISOString() ?? null,
        fromScopeName: scopeNameFromContext(row.fromContext as ContextWithOwner),
        toScopeName: scopeNameFromContext(row.toContext as ContextWithOwner),
        canAccept: canDecide,
        canReject: canDecide,
        canWithdraw,
      };
    });

  return {
    items,
    total,
    limit: query.limit,
    offset: query.offset,
    direction: query.direction,
    status: query.status,
  };
}
