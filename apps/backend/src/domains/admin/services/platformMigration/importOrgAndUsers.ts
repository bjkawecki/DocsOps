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
  const { prisma, idMap } = ctx;

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
    const created = await prisma.company.create({ data: { name: c.name } });
    idMap.set(c.exportId, created.id);
  }
  for (const d of org.departments) {
    const created = await prisma.department.create({
      data: {
        name: d.name,
        companyId: idMap.getOrThrow(d.companyExportId),
      },
    });
    idMap.set(d.exportId, created.id);
  }
  for (const t of org.teams) {
    const created = await prisma.team.create({
      data: {
        name: t.name,
        departmentId: idMap.getOrThrow(t.departmentExportId),
      },
    });
    idMap.set(t.exportId, created.id);
  }

  const users = await readExportUsers(ctx.bundleDir);

  await onPhase('importing_users');

  const importedUserIds: string[] = [];
  for (const u of users) {
    const userId = await resolveOrCreateImportedUser(prisma, u, ctx.transferPasswordHashes);
    idMap.set(u.exportId, userId);
    importedUserIds.push(userId);
  }

  for (const m of org.teamMembers) {
    await prisma.teamMember.create({
      data: {
        teamId: idMap.getOrThrow(m.teamExportId),
        userId: idMap.getOrThrow(m.userExportId),
      },
    });
  }
  for (const l of org.teamLeads) {
    await prisma.teamLead.create({
      data: {
        teamId: idMap.getOrThrow(l.teamExportId),
        userId: idMap.getOrThrow(l.userExportId),
      },
    });
  }
  for (const l of org.departmentLeads) {
    await prisma.departmentLead.create({
      data: {
        departmentId: idMap.getOrThrow(l.departmentExportId),
        userId: idMap.getOrThrow(l.userExportId),
      },
    });
  }
  for (const l of org.companyLeads) {
    await prisma.companyLead.create({
      data: {
        companyId: idMap.getOrThrow(l.companyExportId),
        userId: idMap.getOrThrow(l.userExportId),
      },
    });
  }

  for (const userId of importedUserIds) {
    await stripIncompatibleOrgAssignments(prisma, userId);
  }
}
