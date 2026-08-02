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
  const { prisma, idMap } = ctx;

  const tagsData = await readJson<{
    tags: Array<{ exportId: string; name: string; ownerExportId: string }>;
    documentTags: Array<{ documentExportId: string; tagExportId: string }>;
  }>(join(ctx.bundleDir, 'tags.json'));

  await onPhase('importing_tags');

  for (const t of tagsData.tags) {
    const created = await prisma.tag.create({
      data: {
        name: t.name,
        ownerId: idMap.getOrThrow(t.ownerExportId),
      },
    });
    idMap.set(t.exportId, created.id);
  }
  for (const dt of tagsData.documentTags) {
    await prisma.documentTag.create({
      data: {
        documentId: idMap.getOrThrow(dt.documentExportId),
        tagId: idMap.getOrThrow(dt.tagExportId),
      },
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
    await prisma.documentGrantUser.create({
      data: {
        documentId: idMap.getOrThrow(g.documentExportId),
        userId: idMap.getOrThrow(g.userExportId),
        role: g.role,
      },
    });
  }
  for (const g of grants.teams) {
    if (g.role !== 'Read') continue;
    await prisma.documentGrantTeam.create({
      data: {
        documentId: idMap.getOrThrow(g.documentExportId),
        teamId: idMap.getOrThrow(g.teamExportId),
        role: g.role,
      },
    });
  }
  for (const g of grants.departments) {
    if (g.role !== 'Read') continue;
    await prisma.documentGrantDepartment.create({
      data: {
        documentId: idMap.getOrThrow(g.documentExportId),
        departmentId: idMap.getOrThrow(g.departmentExportId),
        role: g.role,
      },
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
    const created = await prisma.documentPinnedInScope.create({
      data: {
        documentId: idMap.getOrThrow(p.documentExportId),
        scopeType: p.scopeType,
        scopeId: idMap.getOrThrow(p.scopeExportId),
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
