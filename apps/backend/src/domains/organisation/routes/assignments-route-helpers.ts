import type { FastifyReply } from 'fastify';
import type { PrismaClient } from '../../../../generated/prisma/client.js';
import { canViewScope } from '../permissions/scopeVisibility.js';
import {
  assertCanAssignScopeRole,
  ScopeAssignmentConflictError,
  scopeAssignmentConflictBody,
} from '../services/scopeAssignmentRules.js';
import {
  setTeamLead,
  ScopeLeadConflictError,
  scopeLeadConflictBody,
} from '../services/scopeLeadService.js';

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
      void reply.status(409).send(scopeAssignmentConflictBody(err));
      return false;
    }
    throw err;
  }
  await prisma.teamMember.create({
    data: { teamId, userId: bodyUserId },
  });
  return true;
}

/** Team-Lead setzen (create oder replace); bei Fehler wurde geantwortet. */
export async function createTeamLeadAfterVerify(
  prisma: PrismaClient,
  teamId: string,
  bodyUserId: string,
  reply: FastifyReply
): Promise<false | { previousUserId: string | null; replaced: boolean }> {
  if (!(await verifyTeamAndAssignmentUserExist(prisma, teamId, bodyUserId, reply))) return false;
  try {
    const result = await setTeamLead(prisma, teamId, bodyUserId);
    return { previousUserId: result.previousUserId, replaced: result.replaced };
  } catch (err) {
    if (err instanceof ScopeAssignmentConflictError) {
      void reply.status(409).send(scopeAssignmentConflictBody(err));
      return false;
    }
    if (err instanceof ScopeLeadConflictError) {
      void reply.status(409).send(scopeLeadConflictBody(err));
      return false;
    }
    throw err;
  }
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

/** Promote an existing team member to team author (additive overlay; membership kept). */
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
      void reply.status(409).send(scopeAssignmentConflictBody(err));
      return false;
    }
    throw err;
  }

  await prisma.teamAuthor.create({ data: { teamId, userId: bodyUserId } });
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

  await prisma.teamAuthor.delete({ where: { teamId_userId: { teamId, userId: targetUserId } } });
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
      void reply.status(409).send(scopeAssignmentConflictBody(err));
      return false;
    }
    throw err;
  }

  await prisma.departmentAuthor.create({ data: { departmentId, userId: bodyUserId } });
  return true;
}

export async function demoteDepartmentAuthorToMember(
  prisma: PrismaClient,
  departmentId: string,
  targetUserId: string,
  reply: FastifyReply
): Promise<boolean> {
  const existing = await prisma.departmentAuthor.findUnique({
    where: { departmentId_userId: { departmentId, userId: targetUserId } },
  });
  if (!existing) {
    void reply.status(404).send({ error: 'Department author assignment not found' });
    return false;
  }

  await prisma.departmentAuthor.delete({
    where: { departmentId_userId: { departmentId, userId: targetUserId } },
  });
  return true;
}

export async function verifyCompanyAndAssignmentUserExist(
  prisma: PrismaClient,
  companyId: string,
  bodyUserId: string,
  reply: FastifyReply
): Promise<boolean> {
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) {
    void reply.status(404).send({ error: 'Company not found' });
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

export async function listCompanyAuthorsPage(
  prisma: PrismaClient,
  companyId: string,
  query: { limit: number; offset: number }
): Promise<{ items: Array<{ id: string; name: string }>; total: number }> {
  const [rows, total] = await Promise.all([
    prisma.companyAuthor.findMany({
      where: { companyId },
      include: { user: { select: { id: true, name: true } } },
      take: query.limit,
      skip: query.offset,
      orderBy: { userId: 'asc' },
    }),
    prisma.companyAuthor.count({ where: { companyId } }),
  ]);
  return {
    items: rows.map((row) => ({ id: row.user.id, name: row.user.name })),
    total,
  };
}

export async function promoteCompanyMemberToAuthorAfterVerify(
  prisma: PrismaClient,
  companyId: string,
  bodyUserId: string,
  reply: FastifyReply
): Promise<boolean> {
  if (!(await verifyCompanyAndAssignmentUserExist(prisma, companyId, bodyUserId, reply))) {
    return false;
  }

  const existingAuthor = await prisma.companyAuthor.findUnique({
    where: { companyId_userId: { companyId, userId: bodyUserId } },
  });
  if (existingAuthor) {
    void reply.status(409).send({ error: 'User is already a company author' });
    return false;
  }

  const memberTeam = await prisma.teamMember.findFirst({
    where: { userId: bodyUserId, team: { department: { companyId } } },
    select: { teamId: true },
  });
  if (!memberTeam) {
    void reply.status(409).send({
      error: 'User must belong to a team in this company before promotion to author.',
    });
    return false;
  }

  try {
    await assertCanAssignScopeRole(prisma, {
      userId: bodyUserId,
      kind: 'companyAuthor',
      companyId,
    });
  } catch (err) {
    if (err instanceof ScopeAssignmentConflictError) {
      void reply.status(409).send(scopeAssignmentConflictBody(err));
      return false;
    }
    throw err;
  }

  await prisma.companyAuthor.create({ data: { companyId, userId: bodyUserId } });
  return true;
}

export async function demoteCompanyAuthorToMember(
  prisma: PrismaClient,
  companyId: string,
  targetUserId: string,
  reply: FastifyReply
): Promise<boolean> {
  const existing = await prisma.companyAuthor.findUnique({
    where: { companyId_userId: { companyId, userId: targetUserId } },
  });
  if (!existing) {
    void reply.status(404).send({ error: 'Company author assignment not found' });
    return false;
  }

  await prisma.companyAuthor.delete({
    where: { companyId_userId: { companyId, userId: targetUserId } },
  });
  return true;
}
