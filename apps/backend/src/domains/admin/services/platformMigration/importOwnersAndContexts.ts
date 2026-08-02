import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ImportContext, ImportPhaseUpdater } from './importDomainData.js';

async function readJson<T>(path: string): Promise<T> {
  const raw = await readFile(path, 'utf8');
  return JSON.parse(raw) as T;
}

/** Imports owners, then contexts/processes/projects/subcontexts that reference them. */
export async function importOwnersAndContexts(
  ctx: ImportContext,
  onPhase: ImportPhaseUpdater
): Promise<void> {
  const { prisma, idMap } = ctx;

  const owners = await readJson<
    Array<{
      exportId: string;
      companyExportId: string | null;
      departmentExportId: string | null;
      teamExportId: string | null;
      ownerUserExportId: string | null;
      displayName: string | null;
    }>
  >(join(ctx.bundleDir, 'owners.json'));

  await onPhase('importing_owners');

  for (const o of owners) {
    const created = await prisma.owner.create({
      data: {
        companyId: idMap.get(o.companyExportId),
        departmentId: idMap.get(o.departmentExportId),
        teamId: idMap.get(o.teamExportId),
        ownerUserId: idMap.get(o.ownerUserExportId),
        displayName: o.displayName,
      },
    });
    idMap.set(o.exportId, created.id);
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

  for (const c of ctxData.contexts) {
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
  }
  for (const p of ctxData.projects) {
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
  }
  for (const s of ctxData.subcontexts) {
    const created = await prisma.subcontext.create({
      data: {
        name: s.name,
        contextId: idMap.getOrThrow(s.contextExportId),
        projectId: idMap.getOrThrow(s.projectExportId),
        createdAt: new Date(s.createdAt),
        updatedAt: new Date(s.updatedAt),
      },
    });
    idMap.set(s.exportId, created.id);
  }
}
