import type { PrismaClient } from '../../../../../generated/prisma/client.js';
import type { StorageService } from '../../../../infrastructure/storage/index.js';
import { ExportIdMap } from './idRemap.js';
import type { PlatformImportRunStatus } from '../../../../../generated/prisma/client.js';
import { getPlatformImportAdapter } from './adapters/registry.js';
import { importOrgAndUsers } from './importOrgAndUsers.js';
import { importOwnersAndContexts } from './importOwnersAndContexts.js';
import { importDocumentsAndVersions } from './importDocumentsAndVersions.js';
import { importTagsGrantsPinsComments } from './importTagsGrantsPinsComments.js';
import { importAttachmentFiles } from './importAttachmentFiles.js';
import { readPlatformManifestFile } from './platformManifest.js';
import { createEmptyMergeStats, type PlatformImportMergeStats } from './mergeStats.js';
import { join } from 'node:path';

export type ImportPhaseUpdater = (status: PlatformImportRunStatus) => Promise<void>;

/** Shared state passed through the sequential import phases; `idMap` accumulates export-id -> new-id mappings. */
export type ImportContext = {
  prisma: PrismaClient;
  storage: StorageService;
  bundleDir: string;
  idMap: ExportIdMap;
  transferPasswordHashes: boolean;
  /** When true, reuse existing entities by email/name and skip duplicate joins. */
  merge: boolean;
  mergeStats: PlatformImportMergeStats;
};

export async function importDomainDataFromDirectory(
  prisma: PrismaClient,
  storage: StorageService,
  args: {
    bundleDir: string;
    transferPasswordHashes: boolean;
    merge?: boolean;
    onPhase: ImportPhaseUpdater;
  }
): Promise<{ idMap: ExportIdMap; mergeStats: PlatformImportMergeStats }> {
  const manifest = await readPlatformManifestFile(join(args.bundleDir, 'manifest.json'));
  const adapter = getPlatformImportAdapter(manifest.exportFormatVersion);
  await adapter.adaptBundle(args.bundleDir);

  const merge = args.merge === true;
  const ctx: ImportContext = {
    prisma,
    storage,
    bundleDir: args.bundleDir,
    idMap: new ExportIdMap(),
    transferPasswordHashes: args.transferPasswordHashes,
    merge,
    mergeStats: createEmptyMergeStats(),
  };

  await importOrgAndUsers(ctx, args.onPhase);
  await importOwnersAndContexts(ctx, args.onPhase);
  await importDocumentsAndVersions(ctx, args.onPhase);
  await importTagsGrantsPinsComments(ctx, args.onPhase);
  await importAttachmentFiles(ctx, args.onPhase);

  return { idMap: ctx.idMap, mergeStats: ctx.mergeStats };
}
