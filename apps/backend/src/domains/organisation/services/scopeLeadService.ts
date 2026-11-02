import type { PrismaClient } from '../../../../generated/prisma/client.js';
import { assertCanAssignScopeRole } from './scopeAssignmentRules.js';

export const ScopeLeadConflictCode = {
  LAST_TEAM_LEAD: 'LAST_TEAM_LEAD',
  LAST_DEPARTMENT_LEAD: 'LAST_DEPARTMENT_LEAD',
  ALREADY_TEAM_LEAD: 'ALREADY_TEAM_LEAD',
  ALREADY_DEPARTMENT_LEAD: 'ALREADY_DEPARTMENT_LEAD',
} as const;

export type ScopeLeadConflictCodeValue =
  (typeof ScopeLeadConflictCode)[keyof typeof ScopeLeadConflictCode];

const SCOPE_LEAD_FALLBACK: Record<ScopeLeadConflictCodeValue, string> = {
  LAST_TEAM_LEAD: 'Cannot remove the only team lead. Assign a different lead first.',
  LAST_DEPARTMENT_LEAD: 'Cannot remove the only department lead. Assign a different lead first.',
  ALREADY_TEAM_LEAD: 'User is already team lead',
  ALREADY_DEPARTMENT_LEAD: 'User is already department lead',
};

export class ScopeLeadConflictError extends Error {
  readonly code: ScopeLeadConflictCodeValue;

  constructor(code: ScopeLeadConflictCodeValue, message?: string) {
    super(message ?? SCOPE_LEAD_FALLBACK[code]);
    this.name = 'ScopeLeadConflictError';
    this.code = code;
  }
}

export function scopeLeadConflictBody(err: ScopeLeadConflictError): {
  error: string;
  code: ScopeLeadConflictCodeValue;
} {
  return { error: err.message, code: err.code };
}

export type SetScopeLeadResult = {
  previousUserId: string | null;
  userId: string;
  replaced: boolean;
};

/**
 * Sets the single team lead (create or replace) in one transaction.
 * Mutual-exclusivity checks via assertCanAssignScopeRole.
 */
export async function setTeamLead(
  prisma: PrismaClient,
  teamId: string,
  userId: string
): Promise<SetScopeLeadResult> {
  const existing = await prisma.teamLead.findUnique({ where: { teamId } });
  if (existing?.userId === userId) {
    throw new ScopeLeadConflictError(ScopeLeadConflictCode.ALREADY_TEAM_LEAD);
  }

  await assertCanAssignScopeRole(prisma, {
    userId,
    kind: 'teamLead',
    teamId,
  });

  const previousUserId = existing?.userId ?? null;

  await prisma.$transaction(async (tx) => {
    if (existing) {
      await tx.teamLead.delete({ where: { teamId } });
    }
    await tx.teamLead.create({ data: { teamId, userId } });
  });

  return {
    previousUserId,
    userId,
    replaced: previousUserId != null,
  };
}

/**
 * Sets the single department lead (create or replace) in one transaction.
 */
export async function setDepartmentLead(
  prisma: PrismaClient,
  departmentId: string,
  userId: string
): Promise<SetScopeLeadResult> {
  const existing = await prisma.departmentLead.findUnique({ where: { departmentId } });
  if (existing?.userId === userId) {
    throw new ScopeLeadConflictError(ScopeLeadConflictCode.ALREADY_DEPARTMENT_LEAD);
  }

  await assertCanAssignScopeRole(prisma, {
    userId,
    kind: 'departmentLead',
  });

  const previousUserId = existing?.userId ?? null;

  await prisma.$transaction(async (tx) => {
    if (existing) {
      await tx.departmentLead.delete({ where: { departmentId } });
    }
    await tx.departmentLead.create({ data: { departmentId, userId } });
  });

  return {
    previousUserId,
    userId,
    replaced: previousUserId != null,
  };
}

/** Refuses removing the only team lead. */
export async function assertCanRemoveTeamLead(
  prisma: PrismaClient,
  teamId: string,
  targetUserId: string
): Promise<void> {
  const existing = await prisma.teamLead.findUnique({ where: { teamId } });
  if (!existing || existing.userId !== targetUserId) {
    return; // caller returns 404
  }
  throw new ScopeLeadConflictError(ScopeLeadConflictCode.LAST_TEAM_LEAD);
}

/** Refuses removing the only department lead. */
export async function assertCanRemoveDepartmentLead(
  prisma: PrismaClient,
  departmentId: string,
  targetUserId: string
): Promise<void> {
  const existing = await prisma.departmentLead.findUnique({ where: { departmentId } });
  if (!existing || existing.userId !== targetUserId) {
    return;
  }
  throw new ScopeLeadConflictError(ScopeLeadConflictCode.LAST_DEPARTMENT_LEAD);
}
