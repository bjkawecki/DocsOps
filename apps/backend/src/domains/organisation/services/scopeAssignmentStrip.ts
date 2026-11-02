import type { PrismaClient } from '../../../../generated/prisma/client.js';
import { loadActiveUser } from '../permissions/userAccessPredicates.js';
import { getUserScopeRoleTier } from './scopeAssignmentRules.js';

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
      prisma.companyAuthor.deleteMany({ where: { userId } }),
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
      prisma.companyAuthor.deleteMany({ where: { userId } }),
    ]);
    return;
  }

  if (tier === 'department') {
    await prisma.$transaction([
      prisma.teamLead.deleteMany({ where: { userId } }),
      prisma.teamMember.deleteMany({ where: { userId } }),
      prisma.teamAuthor.deleteMany({ where: { userId } }),
      prisma.departmentAuthor.deleteMany({ where: { userId } }),
      prisma.companyAuthor.deleteMany({ where: { userId } }),
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
    // Membership is additive with author; only collapse duplicate author rows.
    if (user.authorOfTeams.length > 1) {
      const [keep] = user.authorOfTeams;
      if (!keep) return;
      await prisma.teamAuthor.deleteMany({
        where: { userId, teamId: { not: keep.teamId } },
      });
    }
    return;
  }

  if (tier === 'companyAuthor') {
    await prisma.$transaction([
      prisma.teamAuthor.deleteMany({ where: { userId } }),
      prisma.departmentAuthor.deleteMany({ where: { userId } }),
    ]);
    if (user.authorOfCompanies.length > 1) {
      const [keep] = user.authorOfCompanies;
      if (!keep) return;
      await prisma.companyAuthor.deleteMany({
        where: { userId, companyId: { not: keep.companyId } },
      });
    }
    return;
  }

  if (tier === 'departmentAuthor') {
    await prisma.companyAuthor.deleteMany({ where: { userId } });
    if (user.authorOfDepartments.length > 1) {
      const [keep] = user.authorOfDepartments;
      if (!keep) return;
      await prisma.departmentAuthor.deleteMany({
        where: { userId, departmentId: { not: keep.departmentId } },
      });
    }
    return;
  }

  if (tier === 'teamMember') {
    // Keep membership; collapse extra author overlays if present.
    if (user.authorOfTeams.length > 1) {
      const [keep] = user.authorOfTeams;
      if (keep) {
        await prisma.teamAuthor.deleteMany({
          where: { userId, teamId: { not: keep.teamId } },
        });
      }
    }
    if (user.authorOfCompanies.length > 1) {
      const [keep] = user.authorOfCompanies;
      if (keep) {
        await prisma.companyAuthor.deleteMany({
          where: { userId, companyId: { not: keep.companyId } },
        });
      }
    }
    if (user.authorOfDepartments.length > 1) {
      const [keep] = user.authorOfDepartments;
      if (keep) {
        await prisma.departmentAuthor.deleteMany({
          where: { userId, departmentId: { not: keep.departmentId } },
        });
      }
    }
    if (user.teamMemberships.length > 1) {
      const [keep] = user.teamMemberships;
      if (!keep) return;
      await prisma.teamMember.deleteMany({
        where: { userId, teamId: { not: keep.team.id } },
      });
    }
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

/**
 * No-op: Author is additive on Member (membership must remain).
 * Kept for call-site compatibility with older migrations/imports.
 */
export async function stripTeamMemberWhereTeamAuthorExists(prisma: PrismaClient): Promise<void> {
  void prisma;
  await Promise.resolve();
}
