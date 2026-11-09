import type { PrismaClient } from '../../../../../generated/prisma/client.js';
import type { ScopePdfOwnerKind } from './scopePdfExportPath.js';
import type { ListedScopePdfDoc, ScopePdfOwnerRef } from './scopePdfExportTypes.js';

type OwnerFilter =
  | { companyId: string; departmentId: null; teamId: null; ownerUserId: null }
  | { departmentId: string; companyId: null; teamId: null; ownerUserId: null }
  | { teamId: string; companyId: null; departmentId: null; ownerUserId: null };

type OwnerSelect = {
  companyId: string | null;
  departmentId: string | null;
  teamId: string | null;
  ownerUserId: string | null;
  company: { name: string } | null;
  department: { name: string } | null;
  team: { name: string } | null;
};

const ownerSelect = {
  companyId: true,
  departmentId: true,
  teamId: true,
  ownerUserId: true,
  company: { select: { name: true } },
  department: { select: { name: true } },
  team: { select: { name: true } },
} as const;

function ownerFromRow(owner: OwnerSelect): {
  ownerKind: ScopePdfOwnerKind;
  scopeName: string;
} | null {
  if (owner.ownerUserId != null) return null;
  if (owner.teamId && owner.team) {
    return { ownerKind: 'team', scopeName: owner.team.name };
  }
  if (owner.departmentId && owner.department) {
    return { ownerKind: 'department', scopeName: owner.department.name };
  }
  if (owner.companyId && owner.company) {
    return { ownerKind: 'company', scopeName: owner.company.name };
  }
  return null;
}

function contextOwnerOr(filters: OwnerFilter[]): Array<
  | { process: { deletedAt: null; archivedAt: null; owner: OwnerFilter } }
  | { project: { deletedAt: null; archivedAt: null; owner: OwnerFilter } }
  | {
      subcontext: {
        project: { deletedAt: null; archivedAt: null; owner: OwnerFilter };
      };
    }
> {
  const clauses: Array<
    | { process: { deletedAt: null; archivedAt: null; owner: OwnerFilter } }
    | { project: { deletedAt: null; archivedAt: null; owner: OwnerFilter } }
    | {
        subcontext: {
          project: { deletedAt: null; archivedAt: null; owner: OwnerFilter };
        };
      }
  > = [];
  for (const ow of filters) {
    clauses.push(
      { process: { deletedAt: null, archivedAt: null, owner: ow } },
      { project: { deletedAt: null, archivedAt: null, owner: ow } },
      {
        subcontext: {
          project: { deletedAt: null, archivedAt: null, owner: ow },
        },
      }
    );
  }
  return clauses;
}

/**
 * Build owner filters for the export root:
 * - company -> company + all its departments + all teams under those departments
 * - department -> department + its teams
 * - team -> that team only
 */
async function resolveOwnerFilters(
  prisma: PrismaClient,
  owner: ScopePdfOwnerRef
): Promise<OwnerFilter[]> {
  if (owner.kind === 'team') {
    return [{ teamId: owner.teamId, companyId: null, departmentId: null, ownerUserId: null }];
  }

  if (owner.kind === 'department') {
    const teams = await prisma.team.findMany({
      where: { departmentId: owner.departmentId },
      select: { id: true },
    });
    return [
      {
        departmentId: owner.departmentId,
        companyId: null,
        teamId: null,
        ownerUserId: null,
      },
      ...teams.map((t): OwnerFilter => ({
        teamId: t.id,
        companyId: null,
        departmentId: null,
        ownerUserId: null,
      })),
    ];
  }

  const departments = await prisma.department.findMany({
    where: { companyId: owner.companyId },
    select: { id: true },
  });
  const departmentIds = departments.map((d) => d.id);
  const teams =
    departmentIds.length === 0
      ? []
      : await prisma.team.findMany({
          where: { departmentId: { in: departmentIds } },
          select: { id: true },
        });

  return [
    {
      companyId: owner.companyId,
      departmentId: null,
      teamId: null,
      ownerUserId: null,
    },
    ...departments.map((d): OwnerFilter => ({
      departmentId: d.id,
      companyId: null,
      teamId: null,
      ownerUserId: null,
    })),
    ...teams.map((t): OwnerFilter => ({
      teamId: t.id,
      companyId: null,
      departmentId: null,
      ownerUserId: null,
    })),
  ];
}

/** Published org documents for the export root including child scopes (dept/teams under company, etc.). */
export async function listPublishedDocumentsForOwnerScope(
  prisma: PrismaClient,
  owner: ScopePdfOwnerRef
): Promise<ListedScopePdfDoc[]> {
  const filters = await resolveOwnerFilters(prisma, owner);
  if (filters.length === 0) return [];

  const docs = await prisma.document.findMany({
    where: {
      deletedAt: null,
      archivedAt: null,
      publishedAt: { not: null },
      currentPublishedVersionId: { not: null },
      contextId: { not: null },
      OR: contextOwnerOr(filters).map((clause) => ({ context: clause })),
    },
    select: {
      id: true,
      title: true,
      currentPublishedVersionId: true,
      currentPublishedVersion: { select: { id: true, pdfObjectKey: true } },
      context: {
        select: {
          process: {
            select: { name: true, owner: { select: ownerSelect } },
          },
          project: {
            select: { name: true, owner: { select: ownerSelect } },
          },
          subcontext: {
            select: {
              name: true,
              project: {
                select: { name: true, owner: { select: ownerSelect } },
              },
            },
          },
        },
      },
    },
  });

  const out: ListedScopePdfDoc[] = [];
  for (const doc of docs) {
    const versionId = doc.currentPublishedVersionId;
    if (!versionId || !doc.currentPublishedVersion || !doc.context) continue;

    let contextKind: 'process' | 'project' | null = null;
    let contextName: string | null = null;
    let subcontextName: string | null = null;
    let ownerRow: OwnerSelect | null = null;

    if (doc.context.process) {
      contextKind = 'process';
      contextName = doc.context.process.name;
      ownerRow = doc.context.process.owner;
    } else if (doc.context.project) {
      contextKind = 'project';
      contextName = doc.context.project.name;
      ownerRow = doc.context.project.owner;
    } else if (doc.context.subcontext?.project) {
      contextKind = 'project';
      contextName = doc.context.subcontext.project.name;
      subcontextName = doc.context.subcontext.name;
      ownerRow = doc.context.subcontext.project.owner;
    }

    if (!contextKind || !contextName || !ownerRow) continue;
    const resolved = ownerFromRow(ownerRow);
    if (!resolved) continue;

    out.push({
      documentId: doc.id,
      versionId,
      title: doc.title,
      pdfObjectKey: doc.currentPublishedVersion.pdfObjectKey,
      ownerKind: resolved.ownerKind,
      scopeName: resolved.scopeName,
      contextKind,
      contextName,
      subcontextName,
    });
  }

  return out;
}
