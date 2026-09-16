import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ImportContext, ImportPhaseUpdater } from './importDomainData.js';

async function readJson<T>(path: string): Promise<T> {
  const raw = await readFile(path, 'utf8');
  return JSON.parse(raw) as T;
}

/** Imports tags, read grants, pins and comments attached to already-imported documents. */
export async function importTagsGrantsPinsComments(
  ctx: ImportContext,
  onPhase: ImportPhaseUpdater
): Promise<void> {
  const { prisma, idMap, merge, mergeStats } = ctx;

  const tagsData = await readJson<{
    tags: Array<{ exportId: string; name: string; ownerExportId: string }>;
    documentTags: Array<{ documentExportId: string; tagExportId: string }>;
  }>(join(ctx.bundleDir, 'tags.json'));

  await onPhase('importing_tags');

  for (const t of tagsData.tags) {
    const ownerId = idMap.getOrThrow(t.ownerExportId);
    if (merge) {
      const existing = await prisma.tag.findUnique({
        where: { ownerId_name: { ownerId, name: t.name } },
        select: { id: true },
      });
      if (existing) {
        idMap.set(t.exportId, existing.id);
        mergeStats.reused.tags += 1;
        continue;
      }
    }
    const created = await prisma.tag.create({
      data: {
        name: t.name,
        ownerId,
      },
    });
    idMap.set(t.exportId, created.id);
    mergeStats.created.tags += 1;
  }
  for (const dt of tagsData.documentTags) {
    const documentId = idMap.getOrThrow(dt.documentExportId);
    const tagId = idMap.getOrThrow(dt.tagExportId);
    if (merge) {
      const existing = await prisma.documentTag.findUnique({
        where: { documentId_tagId: { documentId, tagId } },
        select: { documentId: true },
      });
      if (existing) {
        mergeStats.skipped.documentTags += 1;
        continue;
      }
    }
    await prisma.documentTag.create({
      data: { documentId, tagId },
    });
  }

  const grants = await readJson<{
    users: Array<{ documentExportId: string; userExportId: string; role: 'Read' | 'Write' }>;
    teams: Array<{ documentExportId: string; teamExportId: string; role: 'Read' | 'Write' }>;
    departments: Array<{
      documentExportId: string;
      departmentExportId: string;
      role: 'Read' | 'Write';
    }>;
  }>(join(ctx.bundleDir, 'grants.json'));

  await onPhase('importing_grants');

  for (const g of grants.users) {
    if (g.role !== 'Read') continue;
    const documentId = idMap.getOrThrow(g.documentExportId);
    const userId = idMap.getOrThrow(g.userExportId);
    if (merge) {
      const existing = await prisma.documentGrantUser.findUnique({
        where: {
          documentId_userId_role: { documentId, userId, role: g.role },
        },
        select: { documentId: true },
      });
      if (existing) {
        mergeStats.skipped.grants += 1;
        continue;
      }
    }
    await prisma.documentGrantUser.create({
      data: { documentId, userId, role: g.role },
    });
  }
  for (const g of grants.teams) {
    if (g.role !== 'Read') continue;
    const documentId = idMap.getOrThrow(g.documentExportId);
    const teamId = idMap.getOrThrow(g.teamExportId);
    if (merge) {
      const existing = await prisma.documentGrantTeam.findUnique({
        where: {
          documentId_teamId_role: { documentId, teamId, role: g.role },
        },
        select: { documentId: true },
      });
      if (existing) {
        mergeStats.skipped.grants += 1;
        continue;
      }
    }
    await prisma.documentGrantTeam.create({
      data: { documentId, teamId, role: g.role },
    });
  }
  for (const g of grants.departments) {
    if (g.role !== 'Read') continue;
    const documentId = idMap.getOrThrow(g.documentExportId);
    const departmentId = idMap.getOrThrow(g.departmentExportId);
    if (merge) {
      const existing = await prisma.documentGrantDepartment.findUnique({
        where: {
          documentId_departmentId_role: { documentId, departmentId, role: g.role },
        },
        select: { documentId: true },
      });
      if (existing) {
        mergeStats.skipped.grants += 1;
        continue;
      }
    }
    await prisma.documentGrantDepartment.create({
      data: { documentId, departmentId, role: g.role },
    });
  }

  const pins = await readJson<
    Array<{
      exportId: string;
      documentExportId: string;
      scopeType: 'team' | 'department' | 'company';
      scopeExportId: string;
      order: number;
      pinnedByExportId: string | null;
      createdAt: string;
    }>
  >(join(ctx.bundleDir, 'pins.json'));

  await onPhase('importing_pins');

  for (const p of pins) {
    const documentId = idMap.getOrThrow(p.documentExportId);
    const scopeId = idMap.getOrThrow(p.scopeExportId);
    if (merge) {
      const existing = await prisma.documentPinnedInScope.findUnique({
        where: {
          scopeType_scopeId_documentId: {
            scopeType: p.scopeType,
            scopeId,
            documentId,
          },
        },
        select: { id: true },
      });
      if (existing) {
        idMap.set(p.exportId, existing.id);
        mergeStats.skipped.pins += 1;
        continue;
      }
    }
    const created = await prisma.documentPinnedInScope.create({
      data: {
        documentId,
        scopeType: p.scopeType,
        scopeId,
        order: p.order,
        pinnedById: idMap.get(p.pinnedByExportId),
        createdAt: new Date(p.createdAt),
      },
    });
    idMap.set(p.exportId, created.id);
  }

  const comments = await readJson<
    Array<{
      exportId: string;
      documentExportId: string;
      authorExportId: string;
      text: string;
      parentExportId: string | null;
      anchorHeadingId: string | null;
      deletedAt: string | null;
      createdAt: string;
      updatedAt: string;
    }>
  >(join(ctx.bundleDir, 'comments.json'));

  await onPhase('importing_comments');

  const rootComments = comments.filter((c) => !c.parentExportId);
  const replyComments = comments.filter((c) => c.parentExportId);

  for (const c of rootComments) {
    const created = await prisma.documentComment.create({
      data: {
        documentId: idMap.getOrThrow(c.documentExportId),
        authorId: idMap.getOrThrow(c.authorExportId),
        text: c.text,
        parentId: null,
        anchorHeadingId: c.anchorHeadingId,
        deletedAt: c.deletedAt ? new Date(c.deletedAt) : null,
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt),
      },
    });
    idMap.set(c.exportId, created.id);
  }
  for (const c of replyComments) {
    const created = await prisma.documentComment.create({
      data: {
        documentId: idMap.getOrThrow(c.documentExportId),
        authorId: idMap.getOrThrow(c.authorExportId),
        text: c.text,
        parentId: idMap.getOrThrow(c.parentExportId!),
        anchorHeadingId: null,
        deletedAt: c.deletedAt ? new Date(c.deletedAt) : null,
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt),
      },
    });
    idMap.set(c.exportId, created.id);
  }
}
