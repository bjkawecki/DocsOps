import type { Prisma, PrismaClient } from '../../../../generated/prisma/client.js';
import { loadUser } from '../../documents/permissions/canRead.js';

export type LoadedUser = NonNullable<Awaited<ReturnType<typeof loadUser>>>;

export async function loadActiveUser(
  prisma: PrismaClient | Prisma.TransactionClient,
  userId: string
): Promise<LoadedUser | null> {
  const user = await loadUser(prisma, userId);
  if (!user || user.deletedAt !== null) return null;
  return user;
}

export function isKnowledgeManager(user: LoadedUser): boolean {
  return user.isKnowledgeManager === true;
}

export function isKnowledgeManagerForCompany(user: LoadedUser, companyId: string): boolean {
  return (
    isKnowledgeManager(user) &&
    user.knowledgeManagerCompanies.some((c) => c.companyId === companyId)
  );
}

export function isKnowledgeManagerForDepartment(user: LoadedUser, departmentId: string): boolean {
  return (
    isKnowledgeManager(user) &&
    user.knowledgeManagerDepartments.some((d) => d.departmentId === departmentId)
  );
}

export function isKnowledgeManagerForTeam(user: LoadedUser, teamId: string): boolean {
  return isKnowledgeManager(user) && user.knowledgeManagerTeams.some((t) => t.teamId === teamId);
}

/** Exact owner-scope match for KM (no parent→child inheritance). */
export function isKnowledgeManagerForOwnerScope(
  user: LoadedUser,
  owner: {
    companyId?: string | null;
    departmentId?: string | null;
    teamId?: string | null;
    ownerUserId?: string | null;
  }
): boolean {
  if (!isKnowledgeManager(user) || owner.ownerUserId != null) return false;
  if (owner.teamId) return isKnowledgeManagerForTeam(user, owner.teamId);
  if (owner.departmentId) return isKnowledgeManagerForDepartment(user, owner.departmentId);
  if (owner.companyId) return isKnowledgeManagerForCompany(user, owner.companyId);
  return false;
}

export function isCompanyLead(user: LoadedUser, companyId: string): boolean {
  return user.companyLeads.some((c) => c.companyId === companyId);
}

export function isDepartmentLead(user: LoadedUser, departmentId: string): boolean {
  return user.departmentLeads.some((d) => d.departmentId === departmentId);
}

export function isTeamLead(user: LoadedUser, teamId: string): boolean {
  return user.leadOfTeams.some((l) => l.teamId === teamId);
}

export function isTeamMember(user: LoadedUser, teamId: string): boolean {
  return user.teamMemberships.some((m) => m.team.id === teamId);
}

export function isTeamAuthor(user: LoadedUser, teamId: string): boolean {
  return user.authorOfTeams.some((row) => row.teamId === teamId);
}

export function isDepartmentAuthor(user: LoadedUser, departmentId: string): boolean {
  return user.authorOfDepartments.some((row) => row.departmentId === departmentId);
}

export function isTeamAuthorInDepartment(user: LoadedUser, departmentId: string): boolean {
  return user.authorOfTeams.some((row) => row.team.departmentId === departmentId);
}

export function isTeamAuthorInCompany(user: LoadedUser, companyId: string): boolean {
  return user.authorOfTeams.some((row) => row.team.department.companyId === companyId);
}

export function isTeamLeadInDepartment(user: LoadedUser, departmentId: string): boolean {
  return user.leadOfTeams.some((l) => l.team.departmentId === departmentId);
}

export function isMemberInDepartment(user: LoadedUser, departmentId: string): boolean {
  return user.teamMemberships.some((m) => m.team.departmentId === departmentId);
}

export function isDeptLeadInCompany(user: LoadedUser, companyId: string): boolean {
  return user.departmentLeads.some((d) => d.department.companyId === companyId);
}

export function isTeamLeadInCompany(user: LoadedUser, companyId: string): boolean {
  return user.leadOfTeams.some((l) => l.team.department.companyId === companyId);
}

export function isMemberInCompany(user: LoadedUser, companyId: string): boolean {
  return user.teamMemberships.some((m) => m.team.department.companyId === companyId);
}
