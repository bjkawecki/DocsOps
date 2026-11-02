import type { PrismaClient } from '../../../../generated/prisma/client.js';
import { canWrite } from '../../documents/permissions/canWrite.js';
import { loadDocument } from '../../documents/permissions/canRead.js';
import { canRunHealthCheck } from '../../organisation/permissions/healthCheckPermissions.js';
import {
  contextWithOwnerInclude,
  ownerFromContextRow,
  ownerScopeFromOwnerRow,
  toScopeRef,
} from '../../organisation/permissions/ownerScope.js';
import type { ScopeRef } from '../../organisation/permissions/scopeResolution.js';
import { excludeUserIds, listUserIdsWhoCanWriteDocument } from './notificationRecipients.js';

/**
 * Lead recipients for a Do11y owner-scope aggregate notification.
 * Team/Department → the single lead; Company → all company leads; Personal → none.
 */
export async function listHealthCheckLeadUserIdsForOwnerScope(
  prisma: PrismaClient,
  scope: ScopeRef
): Promise<string[]> {
  if (scope.type === 'company') {
    const rows = await prisma.companyLead.findMany({
      where: { companyId: scope.companyId },
      select: { userId: true },
    });
    return filterActive(
      prisma,
      rows.map((r) => r.userId)
    );
  }
  if (scope.type === 'department') {
    const rows = await prisma.departmentLead.findMany({
      where: { departmentId: scope.departmentId },
      select: { userId: true },
    });
    return filterActive(
      prisma,
      rows.map((r) => r.userId)
    );
  }
  const rows = await prisma.teamLead.findMany({
    where: { teamId: scope.teamId },
    select: { userId: true },
  });
  return filterActive(
    prisma,
    rows.map((r) => r.userId)
  );
}

/**
 * Needs-update ping: document write grants + scope authors, excluding Lead/KM and actor.
 */
export async function listHealthCheckNeedsUpdateRecipientIds(
  prisma: PrismaClient,
  documentId: string,
  actorUserId?: string | null
): Promise<string[]> {
  const doc = await loadDocument(prisma, documentId);
  if (!doc?.contextId || !doc.context) return [];

  const ownerRow = ownerFromContextRow(doc.context);
  const owner = ownerScopeFromOwnerRow(ownerRow);
  if (owner.ownerUserId != null) return [];
  const scope = toScopeRef(owner);
  if (!scope) return [];

  const writers = await listUserIdsWhoCanWriteDocument(prisma, documentId);
  const authors = await listScopeAuthorUserIds(prisma, scope);
  const candidates = [...new Set([...writers, ...authors])];

  const verified: string[] = [];
  for (const uid of candidates) {
    if (!(await canWrite(prisma, uid, documentId))) continue;
    if (await canRunHealthCheck(prisma, uid, scope)) continue;
    verified.push(uid);
  }

  return excludeUserIds(verified, actorUserId);
}

/** Resolve owner ScopeRef for a document (null for personal / missing). */
export async function resolveDocumentHealthCheckOwnerScope(
  prisma: PrismaClient,
  documentId: string
): Promise<ScopeRef | null> {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: {
      contextId: true,
      context: { include: contextWithOwnerInclude },
    },
  });
  if (!doc?.contextId || !doc.context) return null;
  const ownerRow = ownerFromContextRow(doc.context);
  const owner = ownerScopeFromOwnerRow(ownerRow);
  if (owner.ownerUserId != null) return null;
  return toScopeRef(owner);
}

export function scopeRefToPayload(scope: ScopeRef): {
  scopeType: 'company' | 'department' | 'team';
  scopeId: string;
} {
  if (scope.type === 'company') return { scopeType: 'company', scopeId: scope.companyId };
  if (scope.type === 'department') return { scopeType: 'department', scopeId: scope.departmentId };
  return { scopeType: 'team', scopeId: scope.teamId };
}

export function scopeRefKey(scope: ScopeRef): string {
  const p = scopeRefToPayload(scope);
  return `${p.scopeType}:${p.scopeId}`;
}

async function listScopeAuthorUserIds(prisma: PrismaClient, scope: ScopeRef): Promise<string[]> {
  if (scope.type === 'team') {
    const rows = await prisma.teamAuthor.findMany({
      where: { teamId: scope.teamId },
      select: { userId: true },
    });
    return rows.map((r) => r.userId);
  }
  if (scope.type === 'department') {
    const rows = await prisma.departmentAuthor.findMany({
      where: { departmentId: scope.departmentId },
      select: { userId: true },
    });
    return rows.map((r) => r.userId);
  }
  return [];
}

async function filterActive(prisma: PrismaClient, userIds: string[]): Promise<string[]> {
  if (userIds.length === 0) return [];
  const active = await prisma.user.findMany({
    where: { id: { in: [...new Set(userIds)] }, deletedAt: null },
    select: { id: true },
  });
  return active.map((u) => u.id);
}
