import type { PrismaClient } from '../../../../generated/prisma/client.js';
import {
  contextWithOwnerInclude,
  ownerFromContextRow,
  ownerScopeFromOwnerRow,
  toScopeRef,
} from './ownerScope.js';
import type { ScopeRef } from './scopeResolution.js';
import { isScopeLead } from './scopeVisibility.js';
import { loadActiveUser } from './userAccessPredicates.js';

/**
 * Whether the user may run Do11y health-check actions (hub/scan/doc decisions/interval)
 * for the given org scope.
 *
 * - Scope lead hierarchy (team/dept/company) → true
 * - Knowledge Manager on exactly this assigned scope → true (via isScopeLead)
 * - Platform admin → always false
 * - Personal scopes are not Do11y; use {@link canRunHealthCheckForDocument}
 */
export async function canRunHealthCheck(
  prisma: PrismaClient,
  userId: string,
  scope: ScopeRef
): Promise<boolean> {
  const user = await loadActiveUser(prisma, userId);
  if (!user) return false;
  if (user.isAdmin) return false;
  return isScopeLead(prisma, userId, scope);
}

/**
 * Health-check right for a document's owner scope.
 * Personal-owned docs → false (outside Do11y). Missing context/owner → false.
 */
export async function canRunHealthCheckForDocument(
  prisma: PrismaClient,
  userId: string,
  documentId: string
): Promise<boolean> {
  const user = await loadActiveUser(prisma, userId);
  if (!user) return false;
  if (user.isAdmin) return false;

  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: {
      contextId: true,
      context: { include: contextWithOwnerInclude },
    },
  });
  if (!doc?.contextId || !doc.context) return false;

  const ownerRow = ownerFromContextRow(doc.context);
  const owner = ownerScopeFromOwnerRow(ownerRow);
  if (owner.ownerUserId != null) return false;

  const scope = toScopeRef(owner);
  if (!scope) return false;
  return isScopeLead(prisma, userId, scope);
}
