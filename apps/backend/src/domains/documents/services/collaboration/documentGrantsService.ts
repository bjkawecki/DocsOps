import type { PrismaClient, GrantRole } from '../../../../../generated/prisma/client.js';
import {
  listUserIdsWhoCanReadDocument,
  listUserIdsWhoCanWriteDocument,
} from '../../../notifications/services/notificationRecipients.js';
import { changedUserIdsFromBeforeAfter } from '../route-support/documentRouteSupport.js';

export class UnsupportedScopeWriteGrantError extends Error {}

/** Owner row shape for document context (process / project / subcontext project). */
const documentContextOwnerSelect = {
  ownerUserId: true,
  companyId: true,
  departmentId: true,
  teamId: true,
  team: {
    select: { departmentId: true, department: { select: { companyId: true } } },
  },
  department: { select: { companyId: true } },
} as const;

const documentOwnerContextSelect = {
  contextId: true,
  context: {
    select: {
      process: { select: { owner: { select: documentContextOwnerSelect } } },
      project: { select: { owner: { select: documentContextOwnerSelect } } },
      subcontext: {
        select: {
          project: { select: { owner: { select: documentContextOwnerSelect } } },
        },
      },
    },
  },
} as const;

type OwnerRow = {
  ownerUserId: string | null;
  companyId: string | null;
  departmentId: string | null;
  teamId: string | null;
  team: { departmentId: string; department: { companyId: string } } | null;
  department: { companyId: string } | null;
};

export type ResolvedDocumentOwnerScope =
  | { kind: 'personal'; ownerUserId: string }
  | { kind: 'team'; teamId: string; departmentId: string; companyId: string }
  | { kind: 'department'; departmentId: string; companyId: string }
  | { kind: 'company'; companyId: string }
  | { kind: 'none' };

export function resolveDocumentOwnerFromContext(
  doc: {
    context?: {
      process?: { owner: OwnerRow } | null;
      project?: { owner: OwnerRow } | null;
      subcontext?: { project?: { owner: OwnerRow } | null } | null;
    } | null;
  } | null
): OwnerRow | null {
  return (
    doc?.context?.process?.owner ??
    doc?.context?.project?.owner ??
    doc?.context?.subcontext?.project?.owner ??
    null
  );
}

/** Most specific owner unit first (do not treat team-owned docs as company-owned). */
export function resolveDocumentOwnerScope(owner: OwnerRow | null): ResolvedDocumentOwnerScope {
  if (!owner) return { kind: 'none' };
  if (owner.ownerUserId != null) return { kind: 'personal', ownerUserId: owner.ownerUserId };
  if (owner.teamId != null) {
    const departmentId = owner.departmentId ?? owner.team?.departmentId;
    const companyId = owner.companyId ?? owner.team?.department?.companyId;
    if (departmentId == null || companyId == null) return { kind: 'none' };
    return { kind: 'team', teamId: owner.teamId, departmentId, companyId };
  }
  if (owner.departmentId != null) {
    const companyId =
      owner.companyId ?? owner.team?.department?.companyId ?? owner.department?.companyId ?? null;
    if (companyId == null) return { kind: 'none' };
    return { kind: 'department', departmentId: owner.departmentId, companyId };
  }
  if (owner.companyId != null) return { kind: 'company', companyId: owner.companyId };
  return { kind: 'none' };
}

async function readWriteUnion(prisma: PrismaClient, documentId: string): Promise<Set<string>> {
  const [readIds, writeIds] = await Promise.all([
    listUserIdsWhoCanReadDocument(prisma, documentId),
    listUserIdsWhoCanWriteDocument(prisma, documentId),
  ]);
  return new Set<string>([...readIds, ...writeIds]);
}

async function grantReplaceChangedUsers(
  prisma: PrismaClient,
  documentId: string,
  before: Set<string>
): Promise<string[]> {
  const [afterRead, afterWrite] = await Promise.all([
    listUserIdsWhoCanReadDocument(prisma, documentId),
    listUserIdsWhoCanWriteDocument(prisma, documentId),
  ]);
  return changedUserIdsFromBeforeAfter({ before, afterRead, afterWrite });
}

function assertReadOnlyUserGrants(grants: Array<{ role: 'Read' | 'Write' }>): void {
  if (grants.some((g) => g.role === 'Write')) {
    throw new UnsupportedScopeWriteGrantError(
      'Document write grants are not supported. Manage authors on the team or department page.'
    );
  }
}

export async function getDocumentGrants(prisma: PrismaClient, documentId: string) {
  const [grantUser, grantTeam, grantDepartment] = await Promise.all([
    prisma.documentGrantUser.findMany({
      where: { documentId, role: GrantRole.Read },
      select: { userId: true, role: true },
    }),
    prisma.documentGrantTeam.findMany({
      where: { documentId, role: GrantRole.Read },
      select: { teamId: true, role: true },
    }),
    prisma.documentGrantDepartment.findMany({
      where: { documentId, role: GrantRole.Read },
      select: { departmentId: true, role: true },
    }),
  ]);
  return {
    users: grantUser.map((g) => ({ userId: g.userId, role: g.role })),
    teams: grantTeam.map((g) => ({ teamId: g.teamId, role: g.role })),
    departments: grantDepartment.map((g) => ({ departmentId: g.departmentId, role: g.role })),
  };
}

export async function listReadGrantCandidates(prisma: PrismaClient, documentId: string) {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: documentOwnerContextSelect,
  });
  if (!doc) return null;

  const ownerScope = resolveDocumentOwnerScope(resolveDocumentOwnerFromContext(doc));
  if (ownerScope.kind === 'none' || ownerScope.kind === 'personal') {
    return { teams: [], departments: [] };
  }

  const companyId = ownerScope.companyId;
  const excludeTeamId = ownerScope.kind === 'team' ? ownerScope.teamId : null;
  const excludeDepartmentId =
    ownerScope.kind === 'team'
      ? ownerScope.departmentId
      : ownerScope.kind === 'department'
        ? ownerScope.departmentId
        : null;

  const [teams, departments] = await Promise.all([
    prisma.team.findMany({
      where: {
        department: { companyId },
        ...(excludeTeamId != null ? { id: { not: excludeTeamId } } : {}),
      },
      select: { id: true, name: true, department: { select: { name: true } } },
      orderBy: [{ name: 'asc' }],
    }),
    prisma.department.findMany({
      where: {
        companyId,
        ...(excludeDepartmentId != null ? { id: { not: excludeDepartmentId } } : {}),
      },
      select: { id: true, name: true },
      orderBy: [{ name: 'asc' }],
    }),
  ]);

  return {
    teams: teams.map((t) => ({
      id: t.id,
      name: t.name,
      departmentName: t.department.name,
    })),
    departments: departments.map((d) => ({ id: d.id, name: d.name })),
  };
}

export async function replaceDocumentUserGrants(
  prisma: PrismaClient,
  args: { documentId: string; grants: Array<{ userId: string; role: 'Read' | 'Write' }> }
) {
  assertReadOnlyUserGrants(args.grants);
  const before = await readWriteUnion(prisma, args.documentId);
  await prisma.documentGrantUser.deleteMany({ where: { documentId: args.documentId } });
  if (args.grants.length > 0) {
    await prisma.documentGrantUser.createMany({
      data: args.grants.map((g) => ({
        documentId: args.documentId,
        userId: g.userId,
        role: g.role as GrantRole,
      })),
      skipDuplicates: true,
    });
  }
  const list = await prisma.documentGrantUser.findMany({
    where: { documentId: args.documentId },
    select: { userId: true, role: true },
  });
  return {
    grants: list,
    changedUserIds: await grantReplaceChangedUsers(prisma, args.documentId, before),
  };
}

export async function replaceDocumentTeamGrants(
  prisma: PrismaClient,
  args: { documentId: string; grants: Array<{ teamId: string; role: 'Read' | 'Write' }> }
) {
  if (args.grants.some((g) => g.role === 'Write')) {
    throw new UnsupportedScopeWriteGrantError(
      'Team write grants are not supported. Manage authors on the team page.'
    );
  }
  const before = await readWriteUnion(prisma, args.documentId);
  await prisma.documentGrantTeam.deleteMany({ where: { documentId: args.documentId } });
  if (args.grants.length > 0) {
    await prisma.documentGrantTeam.createMany({
      data: args.grants.map((g) => ({
        documentId: args.documentId,
        teamId: g.teamId,
        role: g.role as GrantRole,
      })),
      skipDuplicates: true,
    });
  }
  const list = await prisma.documentGrantTeam.findMany({
    where: { documentId: args.documentId },
    select: { teamId: true, role: true },
  });
  return {
    grants: list,
    changedUserIds: await grantReplaceChangedUsers(prisma, args.documentId, before),
  };
}

export async function replaceDocumentDepartmentGrants(
  prisma: PrismaClient,
  args: { documentId: string; grants: Array<{ departmentId: string; role: 'Read' | 'Write' }> }
) {
  if (args.grants.some((g) => g.role === 'Write')) {
    throw new UnsupportedScopeWriteGrantError(
      'Department write grants are not supported. Manage authors on the department page.'
    );
  }
  const before = await readWriteUnion(prisma, args.documentId);
  await prisma.documentGrantDepartment.deleteMany({ where: { documentId: args.documentId } });
  if (args.grants.length > 0) {
    await prisma.documentGrantDepartment.createMany({
      data: args.grants.map((g) => ({
        documentId: args.documentId,
        departmentId: g.departmentId,
        role: g.role as GrantRole,
      })),
      skipDuplicates: true,
    });
  }
  const list = await prisma.documentGrantDepartment.findMany({
    where: { documentId: args.documentId },
    select: { departmentId: true, role: true },
  });
  return {
    grants: list,
    changedUserIds: await grantReplaceChangedUsers(prisma, args.documentId, before),
  };
}
