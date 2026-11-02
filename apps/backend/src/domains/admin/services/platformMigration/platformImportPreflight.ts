import { mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { PrismaClient } from '../../../../../generated/prisma/client.js';
import { extractZstdTarArchive } from '../../../../infrastructure/backup/archiveExtract.js';
import {
  listSupportedExportFormatVersions,
  isSupportedExportFormatVersion,
} from './adapters/registry.js';
import {
  readPlatformManifestFile,
  sha256File,
  type PlatformExportManifest,
} from './platformManifest.js';
import { appVersion } from '../../../../infrastructure/appVersion.js';
import { findExistingEmailsForExportUsers, readExportUsers } from './platformImportUsers.js';
import { MAX_SUPPORTED_BLOCKS_SCHEMA_VERSION } from '../../../documents/services/blocks/blockSchema.js';

export type PlatformImportPreflightResult = {
  ok: boolean;
  exportFormatVersion?: number;
  sourceAppVersion?: string;
  counts?: PlatformExportManifest['counts'];
  targetEmpty: boolean;
  /** True when the target is not empty; confirm must pass merge: true. */
  requiresMerge: boolean;
  targetAppVersion: string;
  sameAppVersion: boolean;
  supportedExportFormatVersions: number[];
  maxBlocksSchemaVersion?: number;
  blockSchemaUpgradeRequired: boolean;
  overlappingUserEmails: string[];
  errors: string[];
  warnings: string[];
};

async function readJsonUnknown(path: string): Promise<unknown> {
  const raw = await readFile(path, 'utf8');
  return JSON.parse(raw) as unknown;
}

function schemaVersionFromJson(value: unknown): number | null {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) return null;
  const version = (value as { schemaVersion?: unknown }).schemaVersion;
  return typeof version === 'number' ? version : null;
}

/**
 * Resolve max block schema version from manifest or by scanning package JSON (older exports).
 */
export async function resolveMaxBlocksSchemaVersion(
  bundleDir: string,
  manifest: PlatformExportManifest
): Promise<number> {
  if (typeof manifest.maxBlocksSchemaVersion === 'number') {
    return manifest.maxBlocksSchemaVersion;
  }

  let max = 0;

  try {
    const documents = (await readJsonUnknown(join(bundleDir, 'documents.json'))) as Array<{
      draftBlocks?: unknown;
    }>;
    if (Array.isArray(documents)) {
      for (const doc of documents) {
        const version = schemaVersionFromJson(doc.draftBlocks);
        if (version != null) max = Math.max(max, version);
      }
    }
  } catch {
    // Missing/invalid file covered by manifest checksum checks
  }

  try {
    const versions = (await readJsonUnknown(join(bundleDir, 'document-versions.json'))) as Array<{
      blocks?: unknown;
      blocksSchemaVersion?: number | null;
    }>;
    if (Array.isArray(versions)) {
      for (const row of versions) {
        if (typeof row.blocksSchemaVersion === 'number') {
          max = Math.max(max, row.blocksSchemaVersion);
        }
        const fromBlocks = schemaVersionFromJson(row.blocks);
        if (fromBlocks != null) max = Math.max(max, fromBlocks);
      }
    }
  } catch {
    // Missing/invalid file covered by manifest checksum checks
  }

  return max;
}

export async function runPlatformImportPreflight(
  prisma: PrismaClient,
  bundleDir: string,
  options?: { merge?: boolean; enforceEmpty?: boolean }
): Promise<PlatformImportPreflightResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const supportedExportFormatVersions = listSupportedExportFormatVersions();
  const merge = options?.merge === true;
  const enforceEmpty = options?.enforceEmpty !== false;

  const [companyCount, documentCount] = await Promise.all([
    prisma.company.count(),
    prisma.document.count(),
  ]);
  const targetEmpty = companyCount === 0 && documentCount === 0;
  const requiresMerge = !targetEmpty;
  if (!targetEmpty && !merge && enforceEmpty) {
    errors.push(
      'Target instance is not empty. Platform import requires an empty instance (no companies or documents), or confirm with merge: true (Reuse + Skip).'
    );
  } else if (!targetEmpty && !merge && !enforceEmpty) {
    warnings.push(
      'Target instance is not empty. Enable merge (Reuse + Skip) on confirm to import into this instance; otherwise import is blocked.'
    );
  } else if (!targetEmpty && merge) {
    warnings.push(
      'Merge import enabled: existing users (by email), org units, owners, processes/projects/tags (by name under parent) will be reused; documents are always created; duplicate memberships/grants/pins are skipped. A failed merge does not wipe the target instance.'
    );
  }

  let manifest: PlatformExportManifest;
  try {
    manifest = await readPlatformManifestFile(join(bundleDir, 'manifest.json'));
  } catch {
    errors.push('manifest.json is missing or invalid');
    return {
      ok: false,
      targetEmpty,
      requiresMerge,
      targetAppVersion: appVersion,
      sameAppVersion: false,
      supportedExportFormatVersions,
      blockSchemaUpgradeRequired: false,
      overlappingUserEmails: [],
      errors,
      warnings,
    };
  }

  if (!isSupportedExportFormatVersion(manifest.exportFormatVersion)) {
    errors.push(
      `Unsupported exportFormatVersion: ${manifest.exportFormatVersion}. Supported: ${supportedExportFormatVersions.join(', ')}`
    );
  }

  for (const [fileName, meta] of Object.entries(manifest.files)) {
    const path = join(bundleDir, fileName);
    try {
      const hash = await sha256File(path);
      if (hash !== meta.sha256) {
        errors.push(`Checksum mismatch for ${fileName}`);
      }
    } catch {
      errors.push(`Missing expected file: ${fileName}`);
    }
  }

  const sameAppVersion = manifest.sourceAppVersion === appVersion;
  if (!sameAppVersion) {
    warnings.push(
      `Source app version (${manifest.sourceAppVersion}) differs from target (${appVersion}). Password hash transfer will be disabled.`
    );
  }

  const maxBlocksSchemaVersion = await resolveMaxBlocksSchemaVersion(bundleDir, manifest);
  if (maxBlocksSchemaVersion > MAX_SUPPORTED_BLOCKS_SCHEMA_VERSION) {
    errors.push(
      `Unsupported maxBlocksSchemaVersion: ${maxBlocksSchemaVersion}. Supported max: ${MAX_SUPPORTED_BLOCKS_SCHEMA_VERSION}`
    );
  }

  const blockSchemaUpgradeRequired = maxBlocksSchemaVersion < MAX_SUPPORTED_BLOCKS_SCHEMA_VERSION;

  if (
    isSupportedExportFormatVersion(manifest.exportFormatVersion) &&
    (!sameAppVersion || blockSchemaUpgradeRequired)
  ) {
    warnings.push(
      'Import will run the format adapter and normalize/validate block documents to the target schema.'
    );
  }

  let overlappingUserEmails: string[] = [];
  try {
    const exportUsers = await readExportUsers(bundleDir);
    overlappingUserEmails = await findExistingEmailsForExportUsers(prisma, exportUsers);
    if (overlappingUserEmails.length > 0) {
      warnings.push(
        `${overlappingUserEmails.length} export user(s) share an email with an existing account on this instance (${overlappingUserEmails.join(', ')}). Those accounts will be linked during import instead of creating duplicates.`
      );
    }
  } catch {
    // users.json missing or invalid; covered by manifest file checks above
  }

  return {
    ok: errors.length === 0,
    exportFormatVersion: manifest.exportFormatVersion,
    sourceAppVersion: manifest.sourceAppVersion,
    counts: manifest.counts,
    targetEmpty,
    requiresMerge,
    targetAppVersion: appVersion,
    sameAppVersion,
    supportedExportFormatVersions,
    maxBlocksSchemaVersion,
    blockSchemaUpgradeRequired,
    overlappingUserEmails,
    errors,
    warnings,
  };
}

export async function extractAndPreflightArchive(
  prisma: PrismaClient,
  archivePath: string,
  workDir: string,
  options?: { merge?: boolean; enforceEmpty?: boolean }
): Promise<{ bundleDir: string; preflight: PlatformImportPreflightResult }> {
  const bundleDir = join(workDir, 'bundle');
  await mkdir(bundleDir, { recursive: true });
  await extractZstdTarArchive(archivePath, bundleDir);
  const preflight = await runPlatformImportPreflight(prisma, bundleDir, options);
  return { bundleDir, preflight };
}
