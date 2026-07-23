import type { PrismaClient } from '../../../../generated/prisma/client.js';
import {
  getReadableCatalogScope,
  getWritableCatalogScope,
} from '../../organisation/permissions/catalogPermissions.js';
import {
  buildCatalogDocumentListBase,
  type CatalogListScopeFilter,
} from '../../documents/services/query/catalogDocumentListWhere.js';

const EXPLORE_PER_COLUMN = 4;
const EXPLORE_MAX_COLUMNS = 3;

export type PulseExploreItem = { id: string; title: string };
export type PulseExploreColumn = {
  key: string;
  title: string;
  items: PulseExploreItem[];
};
export type PulseExploreResponse = { columns: PulseExploreColumn[] };

type ScopeCandidate = {
  key: string;
  title: string;
  kind: 'team' | 'department' | 'company' | 'drafts' | 'your-documents';
  filter?: CatalogListScopeFilter;
};

async function loadPublishedInScope(
  prisma: PrismaClient,
  userId: string,
  filter: CatalogListScopeFilter
): Promise<PulseExploreItem[]> {
  const [readableScope, writableScope] = await Promise.all([
    getReadableCatalogScope(prisma, userId),
    getWritableCatalogScope(prisma, userId),
  ]);
  const catalogBase = buildCatalogDocumentListBase(readableScope, writableScope, userId, filter);
  if (catalogBase == null) return [];

  const docs = await prisma.document.findMany({
    where: {
      AND: [catalogBase.baseWhere, { publishedAt: { not: null } }],
    },
    select: { id: true, title: true },
    orderBy: { publishedAt: 'desc' },
    take: EXPLORE_PER_COLUMN,
  });
  return docs.map((d) => ({ id: d.id, title: d.title }));
}

async function loadCreatorDocs(
  prisma: PrismaClient,
  userId: string,
  published: boolean
): Promise<PulseExploreItem[]> {
  const docs = await prisma.document.findMany({
    where: {
      deletedAt: null,
      archivedAt: null,
      createdById: userId,
      publishedAt: published ? { not: null } : null,
    },
    select: { id: true, title: true },
    orderBy: published ? { publishedAt: 'desc' } : { updatedAt: 'desc' },
    take: EXPLORE_PER_COLUMN,
  });
  return docs.map((d) => ({ id: d.id, title: d.title }));
}

/**
 * When the user has no team/dept/company assignment (typical seed admin),
 * still offer real org scopes they can read (admin: all active contexts).
 */
async function adminOrgScopeCandidates(prisma: PrismaClient): Promise<ScopeCandidate[]> {
  const company = await prisma.company.findFirst({
    select: {
      id: true,
      name: true,
      departments: {
        select: {
          id: true,
          name: true,
          teams: {
            select: { id: true, name: true },
            orderBy: { name: 'asc' },
            take: 1,
          },
        },
        orderBy: { name: 'asc' },
        take: 1,
      },
    },
    orderBy: { name: 'asc' },
  });
  if (!company) return [];

  const candidates: ScopeCandidate[] = [];
  const dept = company.departments[0];
  const team = dept?.teams[0];
  if (team) {
    candidates.push({
      key: `team:${team.id}`,
      title: team.name,
      kind: 'team',
      filter: { teamId: team.id },
    });
  }
  if (dept) {
    candidates.push({
      key: `department:${dept.id}`,
      title: dept.name,
      kind: 'department',
      filter: { departmentId: dept.id },
    });
  }
  candidates.push({
    key: `company:${company.id}`,
    title: company.name,
    kind: 'company',
    filter: { companyId: company.id },
  });
  return candidates;
}

async function buildCandidates(
  prisma: PrismaClient,
  userId: string
): Promise<{
  candidates: ScopeCandidate[];
  isAdmin: boolean;
  usedAdminOrgFallback: boolean;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isAdmin: true,
      teamMemberships: {
        select: {
          team: {
            select: {
              id: true,
              name: true,
              department: {
                select: {
                  id: true,
                  name: true,
                  company: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
      },
      leadOfTeams: {
        select: {
          teamId: true,
          team: {
            select: {
              id: true,
              name: true,
              department: {
                select: {
                  id: true,
                  name: true,
                  company: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
      },
      authorOfTeams: {
        select: {
          teamId: true,
          team: {
            select: {
              id: true,
              name: true,
              department: {
                select: {
                  id: true,
                  name: true,
                  company: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
      },
      departmentLeads: {
        select: {
          departmentId: true,
          department: {
            select: {
              id: true,
              name: true,
              company: { select: { id: true, name: true } },
            },
          },
        },
      },
      authorOfDepartments: {
        select: {
          departmentId: true,
          department: {
            select: {
              id: true,
              name: true,
              company: { select: { id: true, name: true } },
            },
          },
        },
      },
      companyLeads: {
        select: { companyId: true, company: { select: { id: true, name: true } } },
      },
    },
  });
  if (!user) return { candidates: [], isAdmin: false, usedAdminOrgFallback: false };

  const candidates: ScopeCandidate[] = [];

  const firstTeam =
    user.teamMemberships[0]?.team ??
    user.leadOfTeams[0]?.team ??
    user.authorOfTeams[0]?.team ??
    null;
  if (firstTeam) {
    candidates.push({
      key: `team:${firstTeam.id}`,
      title: firstTeam.name,
      kind: 'team',
      filter: { teamId: firstTeam.id },
    });
  }

  const firstDept =
    user.departmentLeads[0]?.department ??
    user.authorOfDepartments[0]?.department ??
    firstTeam?.department ??
    null;
  if (firstDept) {
    candidates.push({
      key: `department:${firstDept.id}`,
      title: firstDept.name,
      kind: 'department',
      filter: { departmentId: firstDept.id },
    });
  }

  const firstCompany =
    user.companyLeads[0]?.company ?? firstDept?.company ?? firstTeam?.department?.company ?? null;
  if (firstCompany) {
    candidates.push({
      key: `company:${firstCompany.id}`,
      title: firstCompany.name,
      kind: 'company',
      filter: { companyId: firstCompany.id },
    });
  }

  let usedAdminOrgFallback = false;
  const hasOrgFilter = candidates.some((c) => c.filter != null);
  if (!hasOrgFilter && user.isAdmin) {
    const adminScopes = await adminOrgScopeCandidates(prisma);
    candidates.push(...adminScopes);
    usedAdminOrgFallback = adminScopes.length > 0;
  }

  candidates.push({ key: 'drafts', title: 'Your drafts', kind: 'drafts' });
  candidates.push({ key: 'your-documents', title: 'Your documents', kind: 'your-documents' });

  return { candidates, isAdmin: user.isAdmin, usedAdminOrgFallback };
}

async function columnsFromCatalog(
  prisma: PrismaClient,
  userId: string
): Promise<{
  columns: PulseExploreColumn[];
  isAdmin: boolean;
  usedAdminOrgFallback: boolean;
  candidateSummaries: Array<{ key: string; kind: string; itemCount: number }>;
}> {
  const { candidates, isAdmin, usedAdminOrgFallback } = await buildCandidates(prisma, userId);
  const columns: PulseExploreColumn[] = [];
  const candidateSummaries: Array<{ key: string; kind: string; itemCount: number }> = [];

  for (const candidate of candidates) {
    let items: PulseExploreItem[] = [];
    if (candidate.kind === 'drafts') {
      items = await loadCreatorDocs(prisma, userId, false);
    } else if (candidate.kind === 'your-documents') {
      items = await loadCreatorDocs(prisma, userId, true);
    } else if (candidate.filter) {
      items = await loadPublishedInScope(prisma, userId, candidate.filter);
    }
    candidateSummaries.push({ key: candidate.key, kind: candidate.kind, itemCount: items.length });

    if (items.length === 0) continue;
    if (columns.length >= EXPLORE_MAX_COLUMNS) continue;
    columns.push({ key: candidate.key, title: candidate.title, items });
  }

  return { columns, isAdmin, usedAdminOrgFallback, candidateSummaries };
}

/**
 * Explore columns for Pulse home from the user's current scopes (org membership,
 * or admin org fallback), plus creator drafts/documents as fill.
 */
export async function getMePulseExplore(
  prisma: PrismaClient,
  userId: string
): Promise<PulseExploreResponse> {
  const { columns, isAdmin, usedAdminOrgFallback, candidateSummaries } = await columnsFromCatalog(
    prisma,
    userId
  );
  // #region agent log
  try {
    const fs = await import('node:fs');
    fs.mkdirSync('/app/.cursor', { recursive: true });
    fs.appendFileSync(
      '/app/.cursor/debug-c2113f.log',
      JSON.stringify({
        sessionId: 'c2113f',
        runId: 'post-fix',
        hypothesisId: 'H7',
        location: 'pulseExploreService.ts:getMePulseExplore',
        message: 'catalog explore result',
        data: {
          userIdPrefix: userId.slice(0, 8),
          isAdmin,
          usedAdminOrgFallback,
          columnCount: columns.length,
          columnKeys: columns.map((c) => c.key),
          itemCounts: columns.map((c) => c.items.length),
          candidateSummaries: candidateSummaries.slice(0, 8),
        },
        timestamp: Date.now(),
      }) + '\n'
    );
  } catch {
    /* ignore debug log failures */
  }
  // #endregion
  return { columns };
}
