import type { PrismaClient } from '../../../../generated/prisma/client.js';
import { canRead } from '../../documents/permissions/canRead.js';
import type { StartHereScopeType } from '../permissions/startHerePermissions.js';

export type ResolvedStartHere = {
  documentId: string;
  title: string;
  scopeType: StartHereScopeType;
  scopeId: string;
  scopeName: string;
};

type TeamStartCandidate = {
  id: string;
  name: string;
  startDocumentId: string | null;
  department: {
    id: string;
    name: string;
    startDocumentId: string | null;
    companyId: string;
    company: { id: string; name: string; startDocumentId: string | null };
  };
};

type DeptStartCandidate = {
  id: string;
  name: string;
  startDocumentId: string | null;
  company: { id: string; name: string; startDocumentId: string | null };
};

type CompanyStartCandidate = { id: string; name: string; startDocumentId: string | null };

async function tryResolveCandidate(
  prisma: PrismaClient,
  userId: string,
  scopeType: StartHereScopeType,
  scopeId: string,
  scopeName: string,
  documentId: string | null
): Promise<ResolvedStartHere | null> {
  if (documentId == null) return null;
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: {
      id: true,
      title: true,
      publishedAt: true,
      deletedAt: true,
      archivedAt: true,
    },
  });
  if (
    !doc ||
    doc.publishedAt == null ||
    doc.deletedAt != null ||
    doc.archivedAt != null ||
    !(await canRead(prisma, userId, doc.id))
  ) {
    return null;
  }
  return {
    documentId: doc.id,
    title: doc.title,
    scopeType,
    scopeId,
    scopeName,
  };
}

/**
 * List Start here for the user: all readable published docs, Teams → Depts → Companies (name asc).
 */
export async function listStartHereForUser(
  prisma: PrismaClient,
  userId: string
): Promise<ResolvedStartHere[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isAdmin: true,
      deletedAt: true,
      teamMemberships: {
        select: {
          team: {
            select: {
              id: true,
              name: true,
              startDocumentId: true,
              departmentId: true,
              department: {
                select: {
                  id: true,
                  name: true,
                  startDocumentId: true,
                  companyId: true,
                  company: { select: { id: true, name: true, startDocumentId: true } },
                },
              },
            },
          },
        },
      },
      leadOfTeams: {
        select: {
          team: {
            select: {
              id: true,
              name: true,
              startDocumentId: true,
              departmentId: true,
              department: {
                select: {
                  id: true,
                  name: true,
                  startDocumentId: true,
                  companyId: true,
                  company: { select: { id: true, name: true, startDocumentId: true } },
                },
              },
            },
          },
        },
      },
      departmentLeads: {
        select: {
          department: {
            select: {
              id: true,
              name: true,
              startDocumentId: true,
              companyId: true,
              company: { select: { id: true, name: true, startDocumentId: true } },
            },
          },
        },
      },
      companyLeads: {
        select: {
          company: { select: { id: true, name: true, startDocumentId: true } },
        },
      },
    },
  });
  if (!user || user.deletedAt != null) return [];

  const items: ResolvedStartHere[] = [];

  const teamsById = new Map<string, TeamStartCandidate>();
  for (const m of user.teamMemberships) {
    teamsById.set(m.team.id, m.team);
  }
  for (const l of user.leadOfTeams) {
    teamsById.set(l.team.id, l.team);
  }

  const deptsById = new Map<string, DeptStartCandidate>();
  for (const team of teamsById.values()) {
    deptsById.set(team.department.id, {
      id: team.department.id,
      name: team.department.name,
      startDocumentId: team.department.startDocumentId,
      company: team.department.company,
    });
  }
  for (const d of user.departmentLeads) {
    deptsById.set(d.department.id, {
      id: d.department.id,
      name: d.department.name,
      startDocumentId: d.department.startDocumentId,
      company: d.department.company,
    });
  }

  const companiesById = new Map<string, CompanyStartCandidate>();
  for (const dept of deptsById.values()) {
    companiesById.set(dept.company.id, dept.company);
  }
  for (const c of user.companyLeads) {
    companiesById.set(c.company.id, c.company);
  }

  // Platform admin has no org membership: company Start here only (no dept/team fallback).
  if (user.isAdmin && companiesById.size === 0) {
    const all = await prisma.company.findMany({
      select: { id: true, name: true, startDocumentId: true },
      orderBy: { name: 'asc' },
    });
    for (const c of all) companiesById.set(c.id, c);
  }

  const teams = [...teamsById.values()].sort((a, b) => a.name.localeCompare(b.name));
  for (const team of teams) {
    const hit = await tryResolveCandidate(
      prisma,
      userId,
      'team',
      team.id,
      team.name,
      team.startDocumentId
    );
    if (hit) items.push(hit);
  }

  const depts = [...deptsById.values()].sort((a, b) => a.name.localeCompare(b.name));
  for (const dept of depts) {
    const hit = await tryResolveCandidate(
      prisma,
      userId,
      'department',
      dept.id,
      dept.name,
      dept.startDocumentId
    );
    if (hit) items.push(hit);
  }

  const companies = [...companiesById.values()].sort((a, b) => a.name.localeCompare(b.name));
  for (const company of companies) {
    const hit = await tryResolveCandidate(
      prisma,
      userId,
      'company',
      company.id,
      company.name,
      company.startDocumentId
    );
    if (hit) items.push(hit);
  }

  return items;
}
