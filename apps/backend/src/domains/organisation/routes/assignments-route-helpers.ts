import type { FastifyReply } from 'fastify';
import type { PrismaClient } from '../../../../generated/prisma/client.js';
import { canViewScope } from '../permissions/scopeVisibility.js';
import {
  assertCanAssignScopeRole,
  ScopeAssignmentConflictError,
} from '../services/scopeAssignmentRules.js';

export async function verifyTeamAndAssignmentUserExist(
  prisma: PrismaClient,
  teamId: string,
  bodyUserId: string,
  reply: FastifyReply
): Promise<boolean> {
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) {
    void reply.status(404).send({ error: 'Team not found' });
    return false;
  }
  const user = await prisma.user.findUnique({
    where: { id: bodyUserId },
    select: { id: true, deletedAt: true },
  });
  if (!user || user.deletedAt) {
    void reply.status(404).send({ error: 'User not found' });
    return false;
  }
  return true;
}

/** GET members / team-leads: gleiche Permission + Pagination-Antwort. */
export async function sendTeamAssignmentListIfAllowed(
  prisma: PrismaClient,
  userId: string,
  teamId: string,
  query: { limit: number; offset: number },
  reply: FastifyReply,
  source: 'member' | 'lead'
): Promise<void> {
  const allowed = await canViewScope(prisma, userId, { type: 'team', teamId });
  if (!allowed) {
    void reply.status(403).send({ error: 'No access to this team' });
    return;
  }
  const { items, total } = await listTeamMembersOrLeadsPage(prisma, teamId, query, source);
  void reply.send({ items, total, limit: query.limit, offset: query.offset });
}

export async function listTeamMembersOrLeadsPage(
  prisma: PrismaClient,
  teamId: string,
  query: { limit: number; offset: number },
  source: 'member' | 'lead'
): Promise<{ items: Array<{ id: string; name: string }>; total: number }> {
  if (source === 'member') {
    const [rows, total] = await Promise.all([
      prisma.teamMember.findMany({
        where: { teamId },
        include: { user: { select: { id: true, name: true } } },
        take: query.limit,
        skip: query.offset,
        orderBy: { userId: 'asc' },
      }),
      prisma.teamMember.count({ where: { teamId } }),
    ]);
    return {
      items: rows.map((m) => ({ id: m.user.id, name: m.user.name })),
      total,
    };
  }
  const [rows, total] = await Promise.all([
    prisma.teamLead.findMany({
      where: { teamId },
      include: { user: { select: { id: true, name: true } } },
      take: query.limit,
      skip: query.offset,
      orderBy: { userId: 'asc' },
    }),
    prisma.teamLead.count({ where: { teamId } }),
  ]);
  return {
    items: rows.map((l) => ({ id: l.user.id, name: l.user.name })),
    total,
  };
}

/** Team-Mitglied anlegen nach Verify; bei Fehler wurde geantwortet. */
export async function createTeamMemberAfterVerify(
  prisma: PrismaClient,
  teamId: string,
  bodyUserId: string,
  reply: FastifyReply
): Promise<boolean> {
  if (!(await verifyTeamAndAssignmentUserExist(prisma, teamId, bodyUserId, reply))) return false;
  const existing = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: bodyUserId } },
  });
  if (existing) {
    void reply.status(409).send({ error: 'User is already a member' });
    return false;
  }
  try {
    await assertCanAssignScopeRole(prisma, {
      userId: bodyUserId,
      kind: 'teamMember',
      teamId,
    });
  } catch (err) {
    if (err instanceof ScopeAssignmentConflictError) {
      void reply.status(409).send({ error: err.message });
      return false;
    }
    throw err;
  }
  await prisma.teamMember.create({
    data: { teamId, userId: bodyUserId },
  });
  return true;
}

/** Team-Lead anlegen (inkl. Mitgliedschaft); bei Fehler wurde geantwortet. */
export async function createTeamLeadAfterVerify(
  prisma: PrismaClient,
  teamId: string,
  bodyUserId: string,
  reply: FastifyReply
): Promise<boolean> {
  if (!(await verifyTeamAndAssignmentUserExist(prisma, teamId, bodyUserId, reply))) return false;
  const existing = await prisma.teamLead.findUnique({
    where: { teamId_userId: { teamId, userId: bodyUserId } },
  });
  if (existing) {
    void reply.status(409).send({ error: 'User is already team lead' });
    return false;
  }
  try {
    await assertCanAssignScopeRole(prisma, {
      userId: bodyUserId,
      kind: 'teamLead',
      teamId,
    });
  } catch (err) {
    if (err instanceof ScopeAssignmentConflictError) {
      void reply.status(409).send({ error: err.message });
      return false;
    }
    throw err;
  }
  await prisma.teamLead.create({
    data: { teamId, userId: bodyUserId },
  });
  return true;
}

export async function listTeamAuthorsPage(
  prisma: PrismaClient,
  teamId: string,
  query: { limit: number; offset: number }
): Promise<{ items: Array<{ id: string; name: string }>; total: number }> {
  const [rows, total] = await Promise.all([
    prisma.teamAuthor.findMany({
      where: { teamId },
      include: { user: { select: { id: true, name: true } } },
      take: query.limit,
      skip: query.offset,
      orderBy: { userId: 'asc' },
    }),
    prisma.teamAuthor.count({ where: { teamId } }),
  ]);
  return {
    items: rows.map((row) => ({ id: row.user.id, name: row.user.name })),
    total,
  };
}

/** Promote an existing team member to team author (exclusive role). */
export async function promoteTeamMemberToAuthorAfterVerify(
  prisma: PrismaClient,
  teamId: string,
  bodyUserId: string,
  reply: FastifyReply
): Promise<boolean> {
  if (!(await verifyTeamAndAssignmentUserExist(prisma, teamId, bodyUserId, reply))) return false;

  const existingAuthor = await prisma.teamAuthor.findUnique({
    where: { teamId_userId: { teamId, userId: bodyUserId } },
  });
  if (existingAuthor) {
    void reply.status(409).send({ error: 'User is already a team author' });
    return false;
  }

  const member = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: bodyUserId } },
  });
  if (!member) {
    void reply.status(409).send({
      error: 'User must be a team member before promotion to author.',
    });
    return false;
  }

  try {
    await assertCanAssignScopeRole(prisma, {
      userId: bodyUserId,
      kind: 'teamAuthor',
      teamId,
    });
  } catch (err) {
    if (err instanceof ScopeAssignmentConflictError) {
      void reply.status(409).send({ error: err.message });
      return false;
    }
    throw err;
  }

  await prisma.$transaction([
    prisma.teamMember.delete({ where: { teamId_userId: { teamId, userId: bodyUserId } } }),
    prisma.teamAuthor.create({ data: { teamId, userId: bodyUserId } }),
  ]);
  return true;
}

export async function demoteTeamAuthorToMember(
  prisma: PrismaClient,
  teamId: string,
  targetUserId: string,
  reply: FastifyReply
): Promise<boolean> {
  const existing = await prisma.teamAuthor.findUnique({
    where: { teamId_userId: { teamId, userId: targetUserId } },
  });
  if (!existing) {
    void reply.status(404).send({ error: 'Team author assignment not found' });
    return false;
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.teamAuthor.delete({ where: { teamId_userId: { teamId, userId: targetUserId } } });
      await assertCanAssignScopeRole(tx, {
        userId: targetUserId,
        kind: 'teamMember',
        teamId,
      });
      await tx.teamMember.create({ data: { teamId, userId: targetUserId } });
    });
  } catch (err) {
    if (err instanceof ScopeAssignmentConflictError) {
      void reply.status(409).send({ error: err.message });
      return false;
    }
    throw err;
  }

  return true;
}

export async function verifyDepartmentAndAssignmentUserExist(
  prisma: PrismaClient,
  departmentId: string,
  bodyUserId: string,
  reply: FastifyReply
): Promise<boolean> {
  const department = await prisma.department.findUnique({ where: { id: departmentId } });
  if (!department) {
    void reply.status(404).send({ error: 'Department not found' });
    return false;
  }
  const user = await prisma.user.findUnique({
    where: { id: bodyUserId },
    select: { id: true, deletedAt: true },
  });
  if (!user || user.deletedAt) {
    void reply.status(404).send({ error: 'User not found' });
    return false;
  }
  return true;
}

export async function listDepartmentAuthorsPage(
  prisma: PrismaClient,
  departmentId: string,
  query: { limit: number; offset: number }
): Promise<{ items: Array<{ id: string; name: string }>; total: number }> {
  const [rows, total] = await Promise.all([
    prisma.departmentAuthor.findMany({
      where: { departmentId },
      include: { user: { select: { id: true, name: true } } },
      take: query.limit,
      skip: query.offset,
      orderBy: { userId: 'asc' },
    }),
    prisma.departmentAuthor.count({ where: { departmentId } }),
  ]);
  return {
    items: rows.map((row) => ({ id: row.user.id, name: row.user.name })),
    total,
  };
}

export async function promoteDepartmentMemberToAuthorAfterVerify(
  prisma: PrismaClient,
  departmentId: string,
  bodyUserId: string,
  reply: FastifyReply
): Promise<boolean> {
  if (!(await verifyDepartmentAndAssignmentUserExist(prisma, departmentId, bodyUserId, reply))) {
    return false;
  }

  const existingAuthor = await prisma.departmentAuthor.findUnique({
    where: { departmentId_userId: { departmentId, userId: bodyUserId } },
  });
  if (existingAuthor) {
    void reply.status(409).send({ error: 'User is already a department author' });
    return false;
  }

  const memberTeam = await prisma.teamMember.findFirst({
    where: { userId: bodyUserId, team: { departmentId } },
    select: { teamId: true },
  });
  if (!memberTeam) {
    void reply.status(409).send({
      error: 'User must belong to a team in this department before promotion to author.',
    });
    return false;
  }

  try {
    await assertCanAssignScopeRole(prisma, {
      userId: bodyUserId,
      kind: 'departmentAuthor',
      departmentId,
    });
  } catch (err) {
    if (err instanceof ScopeAssignmentConflictError) {
      void reply.status(409).send({ error: err.message });
      return false;
    }
    throw err;
  }

  await prisma.$transaction([
    prisma.teamMember.deleteMany({ where: { userId: bodyUserId } }),
    prisma.teamLead.deleteMany({ where: { userId: bodyUserId } }),
    prisma.departmentAuthor.create({ data: { departmentId, userId: bodyUserId } }),
  ]);
  return true;
}

export async function demoteDepartmentAuthorToMember(
  prisma: PrismaClient,
  departmentId: string,
  targetUserId: string,
  teamId: string,
  reply: FastifyReply
): Promise<boolean> {
  const existing = await prisma.departmentAuthor.findUnique({
    where: { departmentId_userId: { departmentId, userId: targetUserId } },
  });
  if (!existing) {
    void reply.status(404).send({ error: 'Department author assignment not found' });
    return false;
  }

  const team = await prisma.team.findFirst({
    where: { id: teamId, departmentId },
    select: { id: true },
  });
  if (!team) {
    void reply.status(400).send({ error: 'Team must belong to this department' });
    return false;
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.departmentAuthor.delete({
        where: { departmentId_userId: { departmentId, userId: targetUserId } },
      });
      await assertCanAssignScopeRole(tx, {
        userId: targetUserId,
        kind: 'teamMember',
        teamId,
      });
      await tx.teamMember.create({ data: { teamId, userId: targetUserId } });
    });
  } catch (err) {
    if (err instanceof ScopeAssignmentConflictError) {
      void reply.status(409).send({ error: err.message });
      return false;
    }
    throw err;
  }

  return true;
}
