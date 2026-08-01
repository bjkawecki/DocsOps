import type { PrismaClient } from '../../../../generated/prisma/client.js';
import type { ScopeRef } from '../../organisation/permissions/scopeResolution.js';
import { isScopeLead } from '../../organisation/permissions/scopeVisibility.js';
import { loadActiveUser } from '../../organisation/permissions/userAccessPredicates.js';

export type TemplateManageScope = ScopeRef | { type: 'platform' };

/**
 * Admin or scope lead may manage custom document types/templates for a scope.
 * Platform-wide customs: Admin only.
 */
export async function canManageDocumentTemplates(
  prisma: PrismaClient,
  userId: string,
  scope: TemplateManageScope
): Promise<boolean> {
  const user = await loadActiveUser(prisma, userId);
  if (!user) return false;
  if (user.isAdmin) return true;
  if (scope.type === 'platform') return false;
  return isScopeLead(prisma, userId, scope);
}

/** True if the user may see the Document templates manage nav (any lead role or admin). */
export async function canAccessDocumentTemplatesManageUi(
  prisma: PrismaClient,
  userId: string
): Promise<boolean> {
  const user = await loadActiveUser(prisma, userId);
  if (!user) return false;
  if (user.isAdmin) return true;
  return (
    user.companyLeads.length > 0 || user.departmentLeads.length > 0 || user.leadOfTeams.length > 0
  );
}
