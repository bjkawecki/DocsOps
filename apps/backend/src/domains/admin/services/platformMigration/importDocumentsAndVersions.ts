import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Prisma } from '../../../../../generated/prisma/client.js';
import type { ImportContext, ImportPhaseUpdater } from './importDomainData.js';

async function readJson<T>(path: string): Promise<T> {
  const raw = await readFile(path, 'utf8');
  return JSON.parse(raw) as T;
}

/** Imports documents and their versions, then wires up parent/published version links. */
export async function importDocumentsAndVersions(
  ctx: ImportContext,
  onPhase: ImportPhaseUpdater
): Promise<void> {
  const { prisma, idMap } = ctx;

  const documents = await readJson<
    Array<{
      exportId: string;
      title: string;
      draftBlocks: Prisma.InputJsonValue | null;
      draftRevision: number;
      pdfUrl: string | null;
      contextExportId: string | null;
      deletedAt: string | null;
      archivedAt: string | null;
      publishedAt: string | null;
      description: string | null;
      createdByExportId: string | null;
      createdAt: string;
      updatedAt: string;
      currentPublishedVersionExportId: string | null;
    }>
  >(join(ctx.bundleDir, 'documents.json'));

  await onPhase('importing_documents');

  for (const d of documents) {
    const created = await prisma.document.create({
      data: {
        title: d.title,
        draftBlocks: d.draftBlocks ?? undefined,
        draftRevision: d.draftRevision,
        pdfUrl: null,
        contextId: idMap.get(d.contextExportId),
        deletedAt: d.deletedAt ? new Date(d.deletedAt) : null,
        archivedAt: d.archivedAt ? new Date(d.archivedAt) : null,
        // publishedAt deferred until currentPublishedVersionId exists (DB CHECK constraint).
        publishedAt: null,
        description: d.description,
        createdById: idMap.get(d.createdByExportId),
        createdAt: new Date(d.createdAt),
        updatedAt: new Date(d.updatedAt),
        currentPublishedVersionId: null,
      },
    });
    idMap.set(d.exportId, created.id);
  }

  const versions = await readJson<
    Array<{
      exportId: string;
      documentExportId: string;
      blocks: Prisma.InputJsonValue | null;
      blocksSchemaVersion: number | null;
      versionNumber: number;
      createdAt: string;
      createdByExportId: string | null;
      parentVersionExportId: string | null;
    }>
  >(join(ctx.bundleDir, 'document-versions.json'));

  await onPhase('importing_versions');

  for (const v of versions) {
    const created = await prisma.documentVersion.create({
      data: {
        documentId: idMap.getOrThrow(v.documentExportId),
        blocks: v.blocks ?? undefined,
        blocksSchemaVersion: v.blocksSchemaVersion,
        versionNumber: v.versionNumber,
        createdAt: new Date(v.createdAt),
        createdById: idMap.get(v.createdByExportId),
        parentVersionId: null,
      },
    });
    idMap.set(v.exportId, created.id);
  }
  for (const v of versions) {
    if (!v.parentVersionExportId) continue;
    await prisma.documentVersion.update({
      where: { id: idMap.getOrThrow(v.exportId) },
      data: { parentVersionId: idMap.getOrThrow(v.parentVersionExportId) },
    });
  }

  for (const d of documents) {
    if (!d.currentPublishedVersionExportId) continue;
    await prisma.document.update({
      where: { id: idMap.getOrThrow(d.exportId) },
      data: {
        currentPublishedVersionId: idMap.getOrThrow(d.currentPublishedVersionExportId),
        publishedAt: d.publishedAt ? new Date(d.publishedAt) : null,
      },
    });
  }
}
