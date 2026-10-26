import type { Prisma, PrismaClient } from '../../../../generated/prisma/client.js';
import { loadActiveUser, type LoadedUser } from '../permissions/userAccessPredicates.js';

export type ScopeAssignmentKind =
  | 'admin'
  | 'knowledgeManager'
  | 'companyLead'
  | 'departmentLead'
  | 'teamLead'
  | 'teamMember'
  | 'teamAuthor'
  | 'departmentAuthor';

export type ScopeRoleTier =
  | 'admin'
  | 'knowledgeManager'
  | 'company'
  | 'department'
  | 'teamLead'
  | 'teamAuthor'
  | 'teamMember'
  | 'departmentAuthor'
  | 'none';

/** Stable API codes for ScopeAssignmentConflictError (i18n via shared.errors.*). */
export const ScopeAssignmentConflictCode = {
  USER_NOT_FOUND: 'SCOPE_USER_NOT_FOUND',
  ADMIN_WHILE_ASSIGNMENTS: 'SCOPE_ADMIN_WHILE_ASSIGNMENTS',
  KM_WHILE_ADMIN: 'SCOPE_KM_WHILE_ADMIN',
  KM_WHILE_ORG: 'SCOPE_KM_WHILE_ORG',
  ADMIN_BLOCKS_ORG: 'SCOPE_ADMIN_BLOCKS_ORG',
  KM_BLOCKS_ORG: 'SCOPE_KM_BLOCKS_ORG',
  ALREADY_COMPANY_LEAD: 'SCOPE_ALREADY_COMPANY_LEAD',
  ALREADY_DEPARTMENT_LEAD: 'SCOPE_ALREADY_DEPARTMENT_LEAD',
  ALREADY_DEPARTMENT_AUTHOR: 'SCOPE_ALREADY_DEPARTMENT_AUTHOR',
  COMPANY_LEAD_CONFLICT: 'SCOPE_COMPANY_LEAD_CONFLICT',
  DEPARTMENT_LEAD_CONFLICT: 'SCOPE_DEPARTMENT_LEAD_CONFLICT',
  DEPT_AUTHOR_HAS_TEAM_LEAD: 'SCOPE_DEPT_AUTHOR_HAS_TEAM_LEAD',
  DEPT_AUTHOR_HAS_TEAM_AUTHOR: 'SCOPE_DEPT_AUTHOR_HAS_TEAM_AUTHOR',
  DEPT_AUTHOR_OUTSIDE_MEMBER: 'SCOPE_DEPT_AUTHOR_OUTSIDE_MEMBER',
  DEPT_AUTHOR_OTHER_DEPT: 'SCOPE_DEPT_AUTHOR_OTHER_DEPT',
  TEAM_LEAD_BLOCKS_ROLE: 'SCOPE_TEAM_LEAD_BLOCKS_ROLE',
  TEAM_AUTHOR_BLOCKS_ROLE: 'SCOPE_TEAM_AUTHOR_BLOCKS_ROLE',
  TEAM_MEMBER_BLOCKS_LEAD: 'SCOPE_TEAM_MEMBER_BLOCKS_LEAD',
  TEAM_ASSIGNMENT_EXISTS: 'SCOPE_TEAM_ASSIGNMENT_EXISTS',
} as const;

export type ScopeAssignmentConflictCodeValue =
  (typeof ScopeAssignmentConflictCode)[keyof typeof ScopeAssignmentConflictCode];

const SCOPE_CONFLICT_FALLBACK: Record<ScopeAssignmentConflictCodeValue, string> = {
  SCOPE_USER_NOT_FOUND: 'User not found',
  SCOPE_ADMIN_WHILE_ASSIGNMENTS:
    'Cannot assign platform administrator while user has organization or knowledge manager assignments. Remove those roles first.',
  SCOPE_KM_WHILE_ADMIN: 'Cannot assign knowledge manager while user is a platform administrator.',
  SCOPE_KM_WHILE_ORG:
    'Cannot assign knowledge manager while user has organization assignments. Remove organization roles first.',
  SCOPE_ADMIN_BLOCKS_ORG:
    'User is a platform administrator and cannot receive organization assignments.',
  SCOPE_KM_BLOCKS_ORG: 'User is a knowledge manager and cannot receive organization assignments.',
  SCOPE_ALREADY_COMPANY_LEAD: 'User already has a company lead assignment.',
  SCOPE_ALREADY_DEPARTMENT_LEAD: 'User already has a department lead assignment.',
  SCOPE_ALREADY_DEPARTMENT_AUTHOR:
    'User already has a department author assignment. Remove it before assigning another organization role.',
  SCOPE_COMPANY_LEAD_CONFLICT:
    'User already has a team or department author assignment. Remove organization roles before assigning company lead.',
  SCOPE_DEPARTMENT_LEAD_CONFLICT:
    'User already has a team assignment. Remove team roles before assigning department lead.',
  SCOPE_DEPT_AUTHOR_HAS_TEAM_LEAD:
    'User already has a team lead assignment. Remove team roles before assigning department author.',
  SCOPE_DEPT_AUTHOR_HAS_TEAM_AUTHOR:
    'User already has a team author assignment. Remove team roles before assigning department author.',
  SCOPE_DEPT_AUTHOR_OUTSIDE_MEMBER:
    'User has team membership outside this department. Remove it before assigning department author.',
  SCOPE_DEPT_AUTHOR_OTHER_DEPT:
    'User already has a department author assignment in another department.',
  SCOPE_TEAM_LEAD_BLOCKS_ROLE:
    'User already has a team lead assignment. Remove the team lead role before assigning another team role.',
  SCOPE_TEAM_AUTHOR_BLOCKS_ROLE:
    'User already has a team author assignment. Remove the team author role before assigning another team role.',
  SCOPE_TEAM_MEMBER_BLOCKS_LEAD:
    'User already has team membership. Remove team membership before assigning team lead.',
  SCOPE_TEAM_ASSIGNMENT_EXISTS:
    'User already has a team assignment. Remove the existing team role before assigning a new one.',
};

export class ScopeAssignmentConflictError extends Error {
  readonly code: ScopeAssignmentConflictCodeValue;

  constructor(code: ScopeAssignmentConflictCodeValue, message?: string) {
    super(message ?? SCOPE_CONFLICT_FALLBACK[code]);
    this.name = 'ScopeAssignmentConflictError';
    this.code = code;
  }
}

/** JSON body for 409 responses from scope assignment conflicts. */
export function scopeAssignmentConflictBody(err: ScopeAssignmentConflictError): {
  error: string;
  code: ScopeAssignmentConflictCodeValue;
} {
  return { error: err.message, code: err.code };
}

function hasTeamAuthorAssignment(user: LoadedUser): boolean {
  return user.authorOfTeams.length > 0;
}

function hasDepartmentAuthorAssignment(user: LoadedUser): boolean {
  return user.authorOfDepartments.length > 0;
}

function hasKnowledgeManagerScopes(user: LoadedUser): boolean {
  return (
    user.knowledgeManagerCompanies.length > 0 ||
    user.knowledgeManagerDepartments.length > 0 ||
    user.knowledgeManagerTeams.length > 0
  );
}

/** Highest organizational / platform role tier for migration and validation. */
export function getUserScopeRoleTier(user: LoadedUser): ScopeRoleTier {
  if (user.isAdmin) return 'admin';
  if (user.isKnowledgeManager || hasKnowledgeManagerScopes(user)) return 'knowledgeManager';
  if (user.companyLeads.length > 0) return 'company';
  if (user.departmentLeads.length > 0) return 'department';
  if (user.leadOfTeams.length > 0) return 'teamLead';
  if (hasTeamAuthorAssignment(user)) return 'teamAuthor';
  if (hasDepartmentAuthorAssignment(user)) return 'departmentAuthor';
  if (user.teamMemberships.length > 0) return 'teamMember';
  return 'none';
}

export function userHasOrgAssignments(user: LoadedUser): boolean {
  return (
    user.companyLeads.length > 0 ||
    user.departmentLeads.length > 0 ||
    user.leadOfTeams.length > 0 ||
    user.teamMemberships.length > 0 ||
    hasTeamAuthorAssignment(user) ||
    hasDepartmentAuthorAssignment(user)
  );
}

function hasTeamAssignment(user: LoadedUser): boolean {
  return (
    user.teamMemberships.length > 0 || user.leadOfTeams.length > 0 || hasTeamAuthorAssignment(user)
  );
}

/**
 * Enforces exclusive scope roles (admin OR one org role). Throws ScopeAssignmentConflictError on violation.
 */
export async function assertCanAssignScopeRole(
  prisma: PrismaClient | Prisma.TransactionClient,
  args: { userId: string; kind: ScopeAssignmentKind; teamId?: string; departmentId?: string }
): Promise<void> {
  const user = await loadActiveUser(prisma, args.userId);
  if (!user) {
    throw new ScopeAssignmentConflictError(ScopeAssignmentConflictCode.USER_NOT_FOUND);
  }

  const { kind } = args;

  if (kind === 'admin') {
    if (userHasOrgAssignments(user) || user.isKnowledgeManager || hasKnowledgeManagerScopes(user)) {
      throw new ScopeAssignmentConflictError(ScopeAssignmentConflictCode.ADMIN_WHILE_ASSIGNMENTS);
    }
    return;
  }

  if (kind === 'knowledgeManager') {
    if (user.isAdmin) {
      throw new ScopeAssignmentConflictError(ScopeAssignmentConflictCode.KM_WHILE_ADMIN);
    }
    if (userHasOrgAssignments(user)) {
      throw new ScopeAssignmentConflictError(ScopeAssignmentConflictCode.KM_WHILE_ORG);
    }
    return;
  }

  if (user.isAdmin) {
    throw new ScopeAssignmentConflictError(ScopeAssignmentConflictCode.ADMIN_BLOCKS_ORG);
  }

  if (user.isKnowledgeManager || hasKnowledgeManagerScopes(user)) {
    throw new ScopeAssignmentConflictError(ScopeAssignmentConflictCode.KM_BLOCKS_ORG);
  }

  if (user.companyLeads.length > 0) {
    throw new ScopeAssignmentConflictError(ScopeAssignmentConflictCode.ALREADY_COMPANY_LEAD);
  }

  if (user.departmentLeads.length > 0) {
    throw new ScopeAssignmentConflictError(ScopeAssignmentConflictCode.ALREADY_DEPARTMENT_LEAD);
  }

  if (hasDepartmentAuthorAssignment(user) && kind !== 'departmentAuthor') {
    throw new ScopeAssignmentConflictError(ScopeAssignmentConflictCode.ALREADY_DEPARTMENT_AUTHOR);
  }

  if (kind === 'companyLead') {
    if (hasTeamAssignment(user) || hasDepartmentAuthorAssignment(user)) {
      throw new ScopeAssignmentConflictError(ScopeAssignmentConflictCode.COMPANY_LEAD_CONFLICT);
    }
    return;
  }

  if (kind === 'departmentLead') {
    if (hasTeamAssignment(user) || hasDepartmentAuthorAssignment(user)) {
      throw new ScopeAssignmentConflictError(ScopeAssignmentConflictCode.DEPARTMENT_LEAD_CONFLICT);
    }
    return;
  }

  if (kind === 'departmentAuthor') {
    if (user.leadOfTeams.length > 0) {
      throw new ScopeAssignmentConflictError(ScopeAssignmentConflictCode.DEPT_AUTHOR_HAS_TEAM_LEAD);
    }
    if (hasTeamAuthorAssignment(user)) {
      throw new ScopeAssignmentConflictError(
        ScopeAssignmentConflictCode.DEPT_AUTHOR_HAS_TEAM_AUTHOR
      );
    }
    const memberOutsideDept = user.teamMemberships.find(
      (m) => m.team.departmentId !== args.departmentId
    );
    if (memberOutsideDept) {
      throw new ScopeAssignmentConflictError(
        ScopeAssignmentConflictCode.DEPT_AUTHOR_OUTSIDE_MEMBER
      );
    }
    const otherDept = user.authorOfDepartments.find((a) => a.departmentId !== args.departmentId);
    if (otherDept) {
      throw new ScopeAssignmentConflictError(ScopeAssignmentConflictCode.DEPT_AUTHOR_OTHER_DEPT);
    }
    return;
  }

  if (user.leadOfTeams.length > 0) {
    if (kind === 'teamMember' || kind === 'teamAuthor') {
      throw new ScopeAssignmentConflictError(ScopeAssignmentConflictCode.TEAM_LEAD_BLOCKS_ROLE);
    }
    const otherTeam = user.leadOfTeams.find((l) => l.teamId !== args.teamId);
    if (otherTeam) {
      throw new ScopeAssignmentConflictError(ScopeAssignmentConflictCode.TEAM_ASSIGNMENT_EXISTS);
    }
    return;
  }

  if (hasTeamAuthorAssignment(user)) {
    if (kind === 'teamMember' || kind === 'teamLead') {
      throw new ScopeAssignmentConflictError(ScopeAssignmentConflictCode.TEAM_AUTHOR_BLOCKS_ROLE);
    }
    const otherTeam = user.authorOfTeams.find((a) => a.teamId !== args.teamId);
    if (otherTeam) {
      throw new ScopeAssignmentConflictError(ScopeAssignmentConflictCode.TEAM_ASSIGNMENT_EXISTS);
    }
    if (kind === 'teamAuthor') return;
  }

  if (user.teamMemberships.length > 0) {
    if (kind === 'teamLead') {
      throw new ScopeAssignmentConflictError(ScopeAssignmentConflictCode.TEAM_MEMBER_BLOCKS_LEAD);
    }
    if (kind === 'teamAuthor') {
      const otherTeam = user.teamMemberships.find((m) => m.team.id !== args.teamId);
      if (otherTeam) {
        throw new ScopeAssignmentConflictError(ScopeAssignmentConflictCode.TEAM_ASSIGNMENT_EXISTS);
      }
      return;
    }
    const otherTeam = user.teamMemberships.find((m) => m.team.id !== args.teamId);
    if (otherTeam) {
      throw new ScopeAssignmentConflictError(ScopeAssignmentConflictCode.TEAM_ASSIGNMENT_EXISTS);
    }
  }
}

/**
 * Removes lower-priority org assignments so each user has at most one role tier.
 * Admin wins over all org roles. Used by data migration and platform import cleanup.
 */
export async function stripIncompatibleOrgAssignments(
  prisma: PrismaClient,
  userId: string
): Promise<void> {
  const user = await loadActiveUser(prisma, userId);
  if (!user) return;

  const tier = getUserScopeRoleTier(user);

  if (tier === 'admin') {
    await prisma.$transaction([
      prisma.companyLead.deleteMany({ where: { userId } }),
      prisma.departmentLead.deleteMany({ where: { userId } }),
      prisma.teamLead.deleteMany({ where: { userId } }),
      prisma.teamMember.deleteMany({ where: { userId } }),
      prisma.teamAuthor.deleteMany({ where: { userId } }),
      prisma.departmentAuthor.deleteMany({ where: { userId } }),
    ]);
    return;
  }

  if (tier === 'company') {
    await prisma.$transaction([
      prisma.departmentLead.deleteMany({ where: { userId } }),
      prisma.teamLead.deleteMany({ where: { userId } }),
      prisma.teamMember.deleteMany({ where: { userId } }),
      prisma.teamAuthor.deleteMany({ where: { userId } }),
      prisma.departmentAuthor.deleteMany({ where: { userId } }),
    ]);
    return;
  }

  if (tier === 'department') {
    await prisma.$transaction([
      prisma.teamLead.deleteMany({ where: { userId } }),
      prisma.teamMember.deleteMany({ where: { userId } }),
      prisma.teamAuthor.deleteMany({ where: { userId } }),
      prisma.departmentAuthor.deleteMany({ where: { userId } }),
    ]);
    return;
  }

  if (tier === 'teamLead') {
    await prisma.$transaction([
      prisma.teamMember.deleteMany({ where: { userId } }),
      prisma.teamAuthor.deleteMany({ where: { userId } }),
    ]);
    if (user.leadOfTeams.length > 1) {
      const [keep] = user.leadOfTeams;
      if (!keep) return;
      await prisma.teamLead.deleteMany({
        where: { userId, teamId: { not: keep.teamId } },
      });
    }
    return;
  }

  if (tier === 'teamAuthor') {
    await prisma.teamMember.deleteMany({ where: { userId } });
    if (user.authorOfTeams.length > 1) {
      const [keep] = user.authorOfTeams;
      if (!keep) return;
      await prisma.teamAuthor.deleteMany({
        where: { userId, teamId: { not: keep.teamId } },
      });
    }
    return;
  }

  if (tier === 'departmentAuthor') {
    if (user.authorOfDepartments.length > 1) {
      const [keep] = user.authorOfDepartments;
      if (!keep) return;
      await prisma.departmentAuthor.deleteMany({
        where: { userId, departmentId: { not: keep.departmentId } },
      });
    }
    return;
  }

  if (tier === 'teamMember' && user.teamMemberships.length > 1) {
    const [keep] = user.teamMemberships;
    if (!keep) return;
    await prisma.teamMember.deleteMany({
      where: { userId, teamId: { not: keep.team.id } },
    });
  }
}

/** Stufe B: remove team membership where the same user is already team lead. */
export async function stripTeamMemberWhereTeamLeadExists(prisma: PrismaClient): Promise<void> {
  const leads = await prisma.teamLead.findMany({
    select: { teamId: true, userId: true },
  });
  for (const lead of leads) {
    await prisma.teamMember.deleteMany({
      where: { teamId: lead.teamId, userId: lead.userId },
    });
  }
}

/** Remove team membership where the same user is already team author. */
export async function stripTeamMemberWhereTeamAuthorExists(prisma: PrismaClient): Promise<void> {
  const authors = await prisma.teamAuthor.findMany({
    select: { teamId: true, userId: true },
  });
  for (const author of authors) {
    await prisma.teamMember.deleteMany({
      where: { teamId: author.teamId, userId: author.userId },
    });
  }
}
