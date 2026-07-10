import type { Prisma, PrismaClient } from '../../../../generated/prisma/client.js';
import { loadActiveUser, type LoadedUser } from '../permissions/userAccessPredicates.js';

export type ScopeAssignmentKind =
  | 'admin'
  | 'companyLead'
  | 'departmentLead'
  | 'teamLead'
  | 'teamMember'
  | 'teamAuthor'
  | 'departmentAuthor';

export type ScopeRoleTier =
  | 'admin'
  | 'company'
  | 'department'
  | 'teamLead'
  | 'teamAuthor'
  | 'teamMember'
  | 'departmentAuthor'
  | 'none';

export class ScopeAssignmentConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ScopeAssignmentConflictError';
  }
}

function hasTeamAuthorAssignment(user: LoadedUser): boolean {
  return user.authorOfTeams.length > 0;
}

function hasDepartmentAuthorAssignment(user: LoadedUser): boolean {
  return user.authorOfDepartments.length > 0;
}

/** Highest organizational / platform role tier for migration and validation. */
export function getUserScopeRoleTier(user: LoadedUser): ScopeRoleTier {
  if (user.isAdmin) return 'admin';
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

function teamAssignmentConflictMessage(kind: ScopeAssignmentKind): string {
  if (kind === 'teamLead') {
    return 'User already has a team assignment. Remove the existing team role before assigning a new one.';
  }
  if (kind === 'teamAuthor') {
    return 'User already has a team assignment. Remove the existing team role before assigning team author.';
  }
  return 'User already has a team assignment. Remove the existing team role before assigning team membership.';
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
    throw new ScopeAssignmentConflictError('User not found');
  }

  const { kind } = args;

  if (kind === 'admin') {
    if (userHasOrgAssignments(user)) {
      throw new ScopeAssignmentConflictError(
        'Cannot assign platform administrator while user has organization assignments. Remove organization roles first.'
      );
    }
    return;
  }

  if (user.isAdmin) {
    throw new ScopeAssignmentConflictError(
      'User is a platform administrator and cannot receive organization assignments.'
    );
  }

  if (user.companyLeads.length > 0) {
    throw new ScopeAssignmentConflictError('User already has a company lead assignment.');
  }

  if (user.departmentLeads.length > 0) {
    throw new ScopeAssignmentConflictError('User already has a department lead assignment.');
  }

  if (hasDepartmentAuthorAssignment(user) && kind !== 'departmentAuthor') {
    throw new ScopeAssignmentConflictError(
      'User already has a department author assignment. Remove it before assigning another organization role.'
    );
  }

  if (kind === 'companyLead') {
    if (hasTeamAssignment(user) || hasDepartmentAuthorAssignment(user)) {
      throw new ScopeAssignmentConflictError(
        'User already has a team or department author assignment. Remove organization roles before assigning company lead.'
      );
    }
    return;
  }

  if (kind === 'departmentLead') {
    if (hasTeamAssignment(user) || hasDepartmentAuthorAssignment(user)) {
      throw new ScopeAssignmentConflictError(
        'User already has a team assignment. Remove team roles before assigning department lead.'
      );
    }
    return;
  }

  if (kind === 'departmentAuthor') {
    if (user.leadOfTeams.length > 0) {
      throw new ScopeAssignmentConflictError(
        'User already has a team lead assignment. Remove team roles before assigning department author.'
      );
    }
    if (hasTeamAuthorAssignment(user)) {
      throw new ScopeAssignmentConflictError(
        'User already has a team author assignment. Remove team roles before assigning department author.'
      );
    }
    const memberOutsideDept = user.teamMemberships.find(
      (m) => m.team.departmentId !== args.departmentId
    );
    if (memberOutsideDept) {
      throw new ScopeAssignmentConflictError(
        'User has team membership outside this department. Remove it before assigning department author.'
      );
    }
    const otherDept = user.authorOfDepartments.find((a) => a.departmentId !== args.departmentId);
    if (otherDept) {
      throw new ScopeAssignmentConflictError(
        'User already has a department author assignment in another department.'
      );
    }
    return;
  }

  if (user.leadOfTeams.length > 0) {
    if (kind === 'teamMember' || kind === 'teamAuthor') {
      throw new ScopeAssignmentConflictError(
        'User already has a team lead assignment. Remove the team lead role before assigning another team role.'
      );
    }
    const otherTeam = user.leadOfTeams.find((l) => l.teamId !== args.teamId);
    if (otherTeam) {
      throw new ScopeAssignmentConflictError(teamAssignmentConflictMessage(kind));
    }
    return;
  }

  if (hasTeamAuthorAssignment(user)) {
    if (kind === 'teamMember' || kind === 'teamLead') {
      throw new ScopeAssignmentConflictError(
        'User already has a team author assignment. Remove the team author role before assigning another team role.'
      );
    }
    const otherTeam = user.authorOfTeams.find((a) => a.teamId !== args.teamId);
    if (otherTeam) {
      throw new ScopeAssignmentConflictError(teamAssignmentConflictMessage(kind));
    }
    if (kind === 'teamAuthor') return;
  }

  if (user.teamMemberships.length > 0) {
    if (kind === 'teamLead') {
      throw new ScopeAssignmentConflictError(
        'User already has team membership. Remove team membership before assigning team lead.'
      );
    }
    if (kind === 'teamAuthor') {
      const otherTeam = user.teamMemberships.find((m) => m.team.id !== args.teamId);
      if (otherTeam) {
        throw new ScopeAssignmentConflictError(teamAssignmentConflictMessage(kind));
      }
      return;
    }
    const otherTeam = user.teamMemberships.find((m) => m.team.id !== args.teamId);
    if (otherTeam) {
      throw new ScopeAssignmentConflictError(teamAssignmentConflictMessage(kind));
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
