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
import { join } from 'node:path';

export type ImportPhaseUpdater = (status: PlatformImportRunStatus) => Promise<void>;

/** Shared state passed through the sequential import phases; `idMap` accumulates export-id -> new-id mappings. */
export type ImportContext = {
  prisma: PrismaClient;
  storage: StorageService;
  bundleDir: string;
  idMap: ExportIdMap;
  transferPasswordHashes: boolean;
};

export async function importDomainDataFromDirectory(
  prisma: PrismaClient,
  storage: StorageService,
  args: {
    bundleDir: string;
    transferPasswordHashes: boolean;
    onPhase: ImportPhaseUpdater;
  }
): Promise<{ idMap: ExportIdMap }> {
  const manifest = await readPlatformManifestFile(join(args.bundleDir, 'manifest.json'));
  const adapter = getPlatformImportAdapter(manifest.exportFormatVersion);
  await adapter.adaptBundle(args.bundleDir);

  const ctx: ImportContext = {
    prisma,
    storage,
    bundleDir: args.bundleDir,
    idMap: new ExportIdMap(),
    transferPasswordHashes: args.transferPasswordHashes,
  };

  await importOrgAndUsers(ctx, args.onPhase);
  await importOwnersAndContexts(ctx, args.onPhase);
  await importDocumentsAndVersions(ctx, args.onPhase);
  await importTagsGrantsPinsComments(ctx, args.onPhase);
  await importAttachmentFiles(ctx, args.onPhase);

  return { idMap: ctx.idMap };
}
