import type { PrismaClient } from '../../../../generated/prisma/client.js';
import { canRead } from '../../documents/permissions/canRead.js';
import {
  documentOwnerContextSelect,
  resolveDocumentOwnerFromContext,
  resolveDocumentOwnerScope,
  type ResolvedDocumentOwnerScope,
} from '../../documents/services/collaboration/documentGrantsService.js';
import {
  canSetStartHere,
  documentBelongsToScopeTree,
  type StartHereScopeType,
} from '../permissions/startHerePermissions.js';
import { listStartHereForUser, type ResolvedStartHere } from './startHereResolve.js';

export type { StartHereScopeType, ResolvedStartHere };
export { canSetStartHere, documentBelongsToScopeTree, listStartHereForUser };

export type StartHereScopeOption = {
  scopeType: StartHereScopeType;
  scopeId: string;
  scopeName: string;
  isCurrent: boolean;
};

async function loadDocumentOwnerScope(
  prisma: PrismaClient,
  documentId: string
): Promise<{
  publishedAt: Date | null;
  deletedAt: Date | null;
  archivedAt: Date | null;
  ownerScope: ResolvedDocumentOwnerScope;
} | null> {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: {
      publishedAt: true,
      deletedAt: true,
      archivedAt: true,
      ...documentOwnerContextSelect,
    },
  });
  if (!doc) return null;
  const owner = resolveDocumentOwnerFromContext(doc);
  return {
    publishedAt: doc.publishedAt,
    deletedAt: doc.deletedAt,
    archivedAt: doc.archivedAt,
    ownerScope: resolveDocumentOwnerScope(owner),
  };
}

export type SetStartHereResult =
  | { ok: true }
  | { ok: false; status: 403 | 404 | 400; error: string };

export async function setStartDocument(
  prisma: PrismaClient,
  actorId: string,
  scopeType: StartHereScopeType,
  scopeId: string,
  documentId: string
): Promise<SetStartHereResult> {
  if (!(await canSetStartHere(prisma, actorId, scopeType, scopeId))) {
    return { ok: false, status: 403, error: 'Permission denied' };
  }

  const loaded = await loadDocumentOwnerScope(prisma, documentId);
  if (!loaded || loaded.deletedAt != null) {
    return { ok: false, status: 404, error: 'Document not found' };
  }
  if (loaded.publishedAt == null) {
    return { ok: false, status: 400, error: 'Document must be published' };
  }
  if (loaded.archivedAt != null) {
    return { ok: false, status: 400, error: 'Document must not be archived' };
  }
  if (!documentBelongsToScopeTree(loaded.ownerScope, scopeType, scopeId)) {
    return { ok: false, status: 400, error: 'Document is not in this scope' };
  }
  if (!(await canRead(prisma, actorId, documentId))) {
    return { ok: false, status: 403, error: 'Permission denied' };
  }

  if (scopeType === 'team') {
    const team = await prisma.team.findUnique({ where: { id: scopeId }, select: { id: true } });
    if (!team) return { ok: false, status: 404, error: 'Team not found' };
    await prisma.team.update({ where: { id: scopeId }, data: { startDocumentId: documentId } });
    return { ok: true };
  }
  if (scopeType === 'department') {
    const dept = await prisma.department.findUnique({
      where: { id: scopeId },
      select: { id: true },
    });
    if (!dept) return { ok: false, status: 404, error: 'Department not found' };
    await prisma.department.update({
      where: { id: scopeId },
      data: { startDocumentId: documentId },
    });
    return { ok: true };
  }
  const company = await prisma.company.findUnique({
    where: { id: scopeId },
    select: { id: true },
  });
  if (!company) return { ok: false, status: 404, error: 'Company not found' };
  await prisma.company.update({
    where: { id: scopeId },
    data: { startDocumentId: documentId },
  });
  return { ok: true };
}

export async function clearStartDocument(
  prisma: PrismaClient,
  actorId: string,
  scopeType: StartHereScopeType,
  scopeId: string
): Promise<SetStartHereResult> {
  if (!(await canSetStartHere(prisma, actorId, scopeType, scopeId))) {
    return { ok: false, status: 403, error: 'Permission denied' };
  }

  if (scopeType === 'team') {
    const team = await prisma.team.findUnique({ where: { id: scopeId }, select: { id: true } });
    if (!team) return { ok: false, status: 404, error: 'Team not found' };
    await prisma.team.update({ where: { id: scopeId }, data: { startDocumentId: null } });
    return { ok: true };
  }
  if (scopeType === 'department') {
    const dept = await prisma.department.findUnique({
      where: { id: scopeId },
      select: { id: true },
    });
    if (!dept) return { ok: false, status: 404, error: 'Department not found' };
    await prisma.department.update({
      where: { id: scopeId },
      data: { startDocumentId: null },
    });
    return { ok: true };
  }
  const company = await prisma.company.findUnique({
    where: { id: scopeId },
    select: { id: true },
  });
  if (!company) return { ok: false, status: 404, error: 'Company not found' };
  await prisma.company.update({ where: { id: scopeId }, data: { startDocumentId: null } });
  return { ok: true };
}

/**
 * Scopes where the actor may set Start here for this document, plus whether it is already set.
 */
export async function listStartHereOptionsForDocument(
  prisma: PrismaClient,
  actorId: string,
  documentId: string
): Promise<StartHereScopeOption[]> {
  const loaded = await loadDocumentOwnerScope(prisma, documentId);
  if (
    !loaded ||
    loaded.deletedAt != null ||
    loaded.publishedAt == null ||
    loaded.archivedAt != null
  )
    return [];

  const ownerScope = loaded.ownerScope;
  if (ownerScope.kind === 'none' || ownerScope.kind === 'personal') return [];

  const candidates: Array<{
    scopeType: StartHereScopeType;
    scopeId: string;
  }> = [];
  if (ownerScope.kind === 'team') {
    candidates.push({ scopeType: 'team', scopeId: ownerScope.teamId });
    candidates.push({ scopeType: 'department', scopeId: ownerScope.departmentId });
    candidates.push({ scopeType: 'company', scopeId: ownerScope.companyId });
  } else if (ownerScope.kind === 'department') {
    candidates.push({ scopeType: 'department', scopeId: ownerScope.departmentId });
    candidates.push({ scopeType: 'company', scopeId: ownerScope.companyId });
  } else if (ownerScope.kind === 'company') {
    candidates.push({ scopeType: 'company', scopeId: ownerScope.companyId });
  }

  const options: StartHereScopeOption[] = [];
  for (const c of candidates) {
    if (!(await canSetStartHere(prisma, actorId, c.scopeType, c.scopeId))) continue;
    if (!documentBelongsToScopeTree(ownerScope, c.scopeType, c.scopeId)) continue;

    if (c.scopeType === 'team') {
      const team = await prisma.team.findUnique({
        where: { id: c.scopeId },
        select: { name: true, startDocumentId: true },
      });
      if (!team) continue;
      options.push({
        scopeType: 'team',
        scopeId: c.scopeId,
        scopeName: team.name,
        isCurrent: team.startDocumentId === documentId,
      });
    } else if (c.scopeType === 'department') {
      const dept = await prisma.department.findUnique({
        where: { id: c.scopeId },
        select: { name: true, startDocumentId: true },
      });
      if (!dept) continue;
      options.push({
        scopeType: 'department',
        scopeId: c.scopeId,
        scopeName: dept.name,
        isCurrent: dept.startDocumentId === documentId,
      });
    } else {
      const company = await prisma.company.findUnique({
        where: { id: c.scopeId },
        select: { name: true, startDocumentId: true },
      });
      if (!company) continue;
      options.push({
        scopeType: 'company',
        scopeId: c.scopeId,
        scopeName: company.name,
        isCurrent: company.startDocumentId === documentId,
      });
    }
  }
  return options;
}
