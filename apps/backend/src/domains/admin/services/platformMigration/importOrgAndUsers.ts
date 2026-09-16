import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ImportContext, ImportPhaseUpdater } from './importDomainData.js';
import { readExportUsers, resolveOrCreateImportedUser } from './platformImportUsers.js';
import { stripIncompatibleOrgAssignments } from '../../../organisation/services/scopeAssignmentRules.js';

async function readJson<T>(path: string): Promise<T> {
  const raw = await readFile(path, 'utf8');
  return JSON.parse(raw) as T;
}

/** Imports companies/departments/teams and users, then the memberships/leads linking them. */
export async function importOrgAndUsers(
  ctx: ImportContext,
  onPhase: ImportPhaseUpdater
): Promise<void> {
  const { prisma, idMap, merge, mergeStats } = ctx;

  const org = await readJson<{
    companies: Array<{ exportId: string; name: string }>;
    departments: Array<{ exportId: string; companyExportId: string; name: string }>;
    teams: Array<{ exportId: string; departmentExportId: string; name: string }>;
    teamMembers: Array<{ teamExportId: string; userExportId: string }>;
    teamLeads: Array<{ teamExportId: string; userExportId: string }>;
    departmentLeads: Array<{ departmentExportId: string; userExportId: string }>;
    companyLeads: Array<{ companyExportId: string; userExportId: string }>;
  }>(join(ctx.bundleDir, 'organization.json'));

  await onPhase('importing_organization');

  for (const c of org.companies) {
    if (merge) {
      const existing = await prisma.company.findFirst({
        where: { name: c.name },
        select: { id: true },
      });
      if (existing) {
        idMap.set(c.exportId, existing.id);
        mergeStats.reused.companies += 1;
        continue;
      }
    }
    const created = await prisma.company.create({ data: { name: c.name } });
    idMap.set(c.exportId, created.id);
    mergeStats.created.companies += 1;
  }
  for (const d of org.departments) {
    const companyId = idMap.getOrThrow(d.companyExportId);
    if (merge) {
      const existing = await prisma.department.findFirst({
        where: { companyId, name: d.name },
        select: { id: true },
      });
      if (existing) {
        idMap.set(d.exportId, existing.id);
        mergeStats.reused.departments += 1;
        continue;
      }
    }
    const created = await prisma.department.create({
      data: {
        name: d.name,
        companyId,
      },
    });
    idMap.set(d.exportId, created.id);
    mergeStats.created.departments += 1;
  }
  for (const t of org.teams) {
    const departmentId = idMap.getOrThrow(t.departmentExportId);
    if (merge) {
      const existing = await prisma.team.findFirst({
        where: { departmentId, name: t.name },
        select: { id: true },
      });
      if (existing) {
        idMap.set(t.exportId, existing.id);
        mergeStats.reused.teams += 1;
        continue;
      }
    }
    const created = await prisma.team.create({
      data: {
        name: t.name,
        departmentId,
      },
    });
    idMap.set(t.exportId, created.id);
    mergeStats.created.teams += 1;
  }

  const users = await readExportUsers(ctx.bundleDir);

  await onPhase('importing_users');

  const importedUserIds: string[] = [];
  for (const u of users) {
    const { userId, reused } = await resolveOrCreateImportedUser(
      prisma,
      u,
      ctx.transferPasswordHashes
    );
    idMap.set(u.exportId, userId);
    importedUserIds.push(userId);
    if (reused) mergeStats.reused.users += 1;
    else mergeStats.created.users += 1;
  }

  for (const m of org.teamMembers) {
    const teamId = idMap.getOrThrow(m.teamExportId);
    const userId = idMap.getOrThrow(m.userExportId);
    if (merge) {
      const existing = await prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId, userId } },
        select: { teamId: true },
      });
      if (existing) {
        mergeStats.skipped.teamMembers += 1;
        continue;
      }
    }
    await prisma.teamMember.create({
      data: { teamId, userId },
    });
  }
  for (const l of org.teamLeads) {
    const teamId = idMap.getOrThrow(l.teamExportId);
    const userId = idMap.getOrThrow(l.userExportId);
    if (merge) {
      const existing = await prisma.teamLead.findUnique({
        where: { teamId_userId: { teamId, userId } },
        select: { teamId: true },
      });
      if (existing) {
        mergeStats.skipped.teamLeads += 1;
        continue;
      }
    }
    await prisma.teamLead.create({
      data: { teamId, userId },
    });
  }
  for (const l of org.departmentLeads) {
    const departmentId = idMap.getOrThrow(l.departmentExportId);
    const userId = idMap.getOrThrow(l.userExportId);
    if (merge) {
      const existing = await prisma.departmentLead.findUnique({
        where: { departmentId_userId: { departmentId, userId } },
        select: { departmentId: true },
      });
      if (existing) {
        mergeStats.skipped.departmentLeads += 1;
        continue;
      }
    }
    await prisma.departmentLead.create({
      data: { departmentId, userId },
    });
  }
  for (const l of org.companyLeads) {
    const companyId = idMap.getOrThrow(l.companyExportId);
    const userId = idMap.getOrThrow(l.userExportId);
    if (merge) {
      const existing = await prisma.companyLead.findUnique({
        where: { companyId_userId: { companyId, userId } },
        select: { companyId: true },
      });
      if (existing) {
        mergeStats.skipped.companyLeads += 1;
        continue;
      }
    }
    await prisma.companyLead.create({
      data: { companyId, userId },
    });
  }

  for (const userId of importedUserIds) {
    await stripIncompatibleOrgAssignments(prisma, userId);
  }
}
