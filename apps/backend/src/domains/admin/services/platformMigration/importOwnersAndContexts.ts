import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ImportContext, ImportPhaseUpdater } from './importDomainData.js';

async function readJson<T>(path: string): Promise<T> {
  const raw = await readFile(path, 'utf8');
  return JSON.parse(raw) as T;
}

type ExportOwner = {
  exportId: string;
  companyExportId: string | null;
  departmentExportId: string | null;
  teamExportId: string | null;
  ownerUserExportId: string | null;
  displayName: string | null;
};

/** Imports owners, then contexts/processes/projects/subcontexts that reference them. */
export async function importOwnersAndContexts(
  ctx: ImportContext,
  onPhase: ImportPhaseUpdater
): Promise<void> {
  const { prisma, idMap, merge, mergeStats } = ctx;

  const owners = await readJson<ExportOwner[]>(join(ctx.bundleDir, 'owners.json'));

  await onPhase('importing_owners');

  for (const o of owners) {
    const companyId = idMap.get(o.companyExportId);
    const departmentId = idMap.get(o.departmentExportId);
    const teamId = idMap.get(o.teamExportId);
    const ownerUserId = idMap.get(o.ownerUserExportId);

    if (merge) {
      const existing = await prisma.owner.findFirst({
        where: {
          companyId: companyId ?? null,
          departmentId: departmentId ?? null,
          teamId: teamId ?? null,
          ownerUserId: ownerUserId ?? null,
        },
        select: { id: true },
      });
      if (existing) {
        idMap.set(o.exportId, existing.id);
        mergeStats.reused.owners += 1;
        continue;
      }
    }

    const created = await prisma.owner.create({
      data: {
        companyId,
        departmentId,
        teamId,
        ownerUserId,
        displayName: o.displayName,
      },
    });
    idMap.set(o.exportId, created.id);
    mergeStats.created.owners += 1;
  }

  const ctxData = await readJson<{
    contexts: Array<{
      exportId: string;
      displayName: string | null;
      contextType: string | null;
      ownerDisplayName: string | null;
    }>;
    processes: Array<{
      exportId: string;
      name: string;
      contextExportId: string;
      ownerExportId: string;
      deletedAt: string | null;
      archivedAt: string | null;
      createdAt: string;
      updatedAt: string;
    }>;
    projects: Array<{
      exportId: string;
      name: string;
      contextExportId: string;
      ownerExportId: string;
      deletedAt: string | null;
      archivedAt: string | null;
      createdAt: string;
      updatedAt: string;
    }>;
    subcontexts: Array<{
      exportId: string;
      name: string;
      contextExportId: string;
      projectExportId: string;
      createdAt: string;
      updatedAt: string;
    }>;
  }>(join(ctx.bundleDir, 'contexts.json'));

  await onPhase('importing_contexts');

  const reusedContextExportIds = new Set<string>();

  for (const p of ctxData.processes) {
    if (!merge) break;
    const ownerId = idMap.getOrThrow(p.ownerExportId);
    const existing = await prisma.process.findFirst({
      where: { ownerId, name: p.name },
      select: { id: true, contextId: true },
    });
    if (existing) {
      idMap.set(p.exportId, existing.id);
      idMap.set(p.contextExportId, existing.contextId);
      reusedContextExportIds.add(p.contextExportId);
      mergeStats.reused.processes += 1;
    }
  }

  for (const p of ctxData.projects) {
    if (!merge) break;
    const ownerId = idMap.getOrThrow(p.ownerExportId);
    const existing = await prisma.project.findFirst({
      where: { ownerId, name: p.name },
      select: { id: true, contextId: true },
    });
    if (existing) {
      idMap.set(p.exportId, existing.id);
      idMap.set(p.contextExportId, existing.contextId);
      reusedContextExportIds.add(p.contextExportId);
      mergeStats.reused.projects += 1;
    }
  }

  for (const c of ctxData.contexts) {
    if (reusedContextExportIds.has(c.exportId)) continue;
    const created = await prisma.context.create({
      data: {
        displayName: c.displayName,
        contextType: c.contextType,
        ownerDisplayName: c.ownerDisplayName,
      },
    });
    idMap.set(c.exportId, created.id);
  }

  for (const p of ctxData.processes) {
    if (merge && idMap.has(p.exportId)) continue;
    const created = await prisma.process.create({
      data: {
        name: p.name,
        contextId: idMap.getOrThrow(p.contextExportId),
        ownerId: idMap.getOrThrow(p.ownerExportId),
        deletedAt: p.deletedAt ? new Date(p.deletedAt) : null,
        archivedAt: p.archivedAt ? new Date(p.archivedAt) : null,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
      },
    });
    idMap.set(p.exportId, created.id);
    mergeStats.created.processes += 1;
  }
  for (const p of ctxData.projects) {
    if (merge && idMap.has(p.exportId)) continue;
    const created = await prisma.project.create({
      data: {
        name: p.name,
        contextId: idMap.getOrThrow(p.contextExportId),
        ownerId: idMap.getOrThrow(p.ownerExportId),
        deletedAt: p.deletedAt ? new Date(p.deletedAt) : null,
        archivedAt: p.archivedAt ? new Date(p.archivedAt) : null,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
      },
    });
    idMap.set(p.exportId, created.id);
    mergeStats.created.projects += 1;
  }
  for (const s of ctxData.subcontexts) {
    const projectId = idMap.getOrThrow(s.projectExportId);
    if (merge) {
      const existing = await prisma.subcontext.findFirst({
        where: { projectId, name: s.name },
        select: { id: true, contextId: true },
      });
      if (existing) {
        idMap.set(s.exportId, existing.id);
        idMap.set(s.contextExportId, existing.contextId);
        mergeStats.reused.subcontexts += 1;
        continue;
      }
    }
    if (idMap.get(s.contextExportId) == null) {
      // Context row for this subcontext was not created yet (not linked via process/project reuse).
      const ctxRow = ctxData.contexts.find((c) => c.exportId === s.contextExportId);
      const createdCtx = await prisma.context.create({
        data: {
          displayName: ctxRow?.displayName ?? s.name,
          contextType: ctxRow?.contextType ?? null,
          ownerDisplayName: ctxRow?.ownerDisplayName ?? null,
        },
      });
      idMap.set(s.contextExportId, createdCtx.id);
    }
    const created = await prisma.subcontext.create({
      data: {
        name: s.name,
        contextId: idMap.getOrThrow(s.contextExportId),
        projectId,
        createdAt: new Date(s.createdAt),
        updatedAt: new Date(s.updatedAt),
      },
    });
    idMap.set(s.exportId, created.id);
    mergeStats.created.subcontexts += 1;
  }
}
