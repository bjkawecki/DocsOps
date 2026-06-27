import type { UserForPermission } from './canRead.js';
import { getDocumentOwner } from './canRead.js';
import type { DocumentForPermission } from './documentLoad.js';

export function isTeamAuthor(user: UserForPermission, teamId: string): boolean {
  return user.authorOfTeams.some((row) => row.teamId === teamId);
}

export function isDepartmentAuthor(user: UserForPermission, departmentId: string): boolean {
  return user.authorOfDepartments.some((row) => row.departmentId === departmentId);
}

export function isScopeAuthorForDocument(
  user: UserForPermission,
  doc: DocumentForPermission
): boolean {
  const owner = getDocumentOwner(doc);
  if (!owner || owner.ownerUserId != null) return false;
  if (owner.teamId != null) {
    return isTeamAuthor(user, owner.teamId);
  }
  if (owner.departmentId != null) {
    return isDepartmentAuthor(user, owner.departmentId);
  }
  return false;
}
