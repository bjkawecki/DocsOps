import type { PrismaClient } from '../../../../generated/prisma/client.js';
import { loadActiveUser } from '../../organisation/permissions/userAccessPredicates.js';
import type { ScopeRef } from '../../organisation/permissions/scopeResolution.js';
import type { MeHealthCheckScopeOption } from '../schemas/me.js';

/**
 * Collects org scopes where the user may run health checks (exact KM + lead hierarchy).
 */
export async function listHealthCheckScopes(
  prisma: PrismaClient,
  userId: string
): Promise<ScopeRef[]> {
  const user = await loadActiveUser(prisma, userId);
  if (!user || user.isAdmin) return [];

  const scopes: ScopeRef[] = [];
  const seen = new Set<string>();
  const add = (ref: ScopeRef) => {
    const key =
      ref.type === 'company'
        ? `c:${ref.companyId}`
        : ref.type === 'department'
          ? `d:${ref.departmentId}`
          : `t:${ref.teamId}`;
    if (seen.has(key)) return;
    seen.add(key);
    scopes.push(ref);
  };

  for (const row of user.companyLeads) {
    add({ type: 'company', companyId: row.companyId });
  }
  for (const row of user.departmentLeads) {
    add({ type: 'department', departmentId: row.departmentId });
  }
  for (const row of user.leadOfTeams) {
    add({ type: 'team', teamId: row.teamId });
  }
  if (user.isKnowledgeManager) {
    for (const row of user.knowledgeManagerCompanies) {
      add({ type: 'company', companyId: row.companyId });
    }
    for (const row of user.knowledgeManagerDepartments) {
      add({ type: 'department', departmentId: row.departmentId });
    }
    for (const row of user.knowledgeManagerTeams) {
      add({ type: 'team', teamId: row.teamId });
    }
  }
  return scopes;
}

/**
 * Filter dropdown scopes: direct Do11y scopes plus departments/teams under company
 * (and teams under department) so company leads can narrow the hub list.
 */
export async function listHealthCheckFilterScopes(
  prisma: PrismaClient,
  userId: string
): Promise<MeHealthCheckScopeOption[]> {
  const base = await listHealthCheckScopes(prisma, userId);
  if (base.length === 0) return [];

  const options: MeHealthCheckScopeOption[] = [];
  const seen = new Set<string>();
  const push = (opt: MeHealthCheckScopeOption) => {
    const key = `${opt.type}:${opt.id}`;
    if (seen.has(key)) return;
    seen.add(key);
    options.push(opt);
  };

  const companyIds = base.filter((s) => s.type === 'company').map((s) => s.companyId);
  const departmentIds = base.filter((s) => s.type === 'department').map((s) => s.departmentId);
  const teamIds = base.filter((s) => s.type === 'team').map((s) => s.teamId);

  if (companyIds.length > 0) {
    const companies = await prisma.company.findMany({
      where: { id: { in: companyIds } },
      select: {
        id: true,
        name: true,
        departments: {
          select: {
            id: true,
            name: true,
            teams: { select: { id: true, name: true } },
          },
        },
      },
    });
    for (const c of companies) {
      push({ type: 'company', id: c.id, label: c.name });
      for (const d of c.departments) {
        push({ type: 'department', id: d.id, label: d.name });
        for (const t of d.teams) {
          push({ type: 'team', id: t.id, label: t.name });
        }
      }
    }
  }

  const remainingDeptIds = departmentIds.filter((id) => !seen.has(`department:${id}`));
  if (remainingDeptIds.length > 0) {
    const departments = await prisma.department.findMany({
      where: { id: { in: remainingDeptIds } },
      select: {
        id: true,
        name: true,
        teams: { select: { id: true, name: true } },
      },
    });
    for (const d of departments) {
      push({ type: 'department', id: d.id, label: d.name });
      for (const t of d.teams) {
        push({ type: 'team', id: t.id, label: t.name });
      }
    }
  }

  const remainingTeamIds = teamIds.filter((id) => !seen.has(`team:${id}`));
  if (remainingTeamIds.length > 0) {
    const teams = await prisma.team.findMany({
      where: { id: { in: remainingTeamIds } },
      select: { id: true, name: true },
    });
    for (const t of teams) {
      push({ type: 'team', id: t.id, label: t.name });
    }
  }

  return options;
}
