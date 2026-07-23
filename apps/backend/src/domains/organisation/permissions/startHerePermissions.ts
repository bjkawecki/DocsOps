import type { PrismaClient } from '../../../../generated/prisma/client.js';
import { canPinForScope } from '../../pinned/permissions/pinnedPermissions.js';
import type { ResolvedDocumentOwnerScope } from '../../documents/services/collaboration/documentGrantsService.js';

export type StartHereScopeType = 'team' | 'department' | 'company';

/** Same gate as pin: scope lead or admin. */
export async function canSetStartHere(
  prisma: PrismaClient,
  userId: string,
  scopeType: StartHereScopeType,
  scopeId: string
): Promise<boolean> {
  return canPinForScope(prisma, userId, scopeType, scopeId);
}

export function documentBelongsToScopeTree(
  ownerScope: ResolvedDocumentOwnerScope,
  scopeType: StartHereScopeType,
  scopeId: string
): boolean {
  if (ownerScope.kind === 'none' || ownerScope.kind === 'personal') return false;
  switch (scopeType) {
    case 'team':
      return ownerScope.kind === 'team' && ownerScope.teamId === scopeId;
    case 'department':
      if (ownerScope.kind === 'department') return ownerScope.departmentId === scopeId;
      if (ownerScope.kind === 'team') return ownerScope.departmentId === scopeId;
      return false;
    case 'company':
      return ownerScope.companyId === scopeId;
    default:
      return false;
  }
}
