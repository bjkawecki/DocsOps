import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { PrismaClient } from '../../../../../generated/prisma/client.js';
import { extractZstdTarArchive } from '../../../../infrastructure/backup/archiveExtract.js';
import {
  isSupportedExportFormatVersion,
  readPlatformManifestFile,
  sha256File,
  type PlatformExportManifest,
} from './platformManifest.js';
import { appVersion } from '../../../../infrastructure/appVersion.js';
import { findExistingEmailsForExportUsers, readExportUsers } from './platformImportUsers.js';

export type PlatformImportPreflightResult = {
  ok: boolean;
  exportFormatVersion?: number;
  sourceAppVersion?: string;
  counts?: PlatformExportManifest['counts'];
  targetEmpty: boolean;
  targetAppVersion: string;
  sameAppVersion: boolean;
  errors: string[];
  warnings: string[];
};

export async function runPlatformImportPreflight(
  prisma: PrismaClient,
  bundleDir: string
): Promise<PlatformImportPreflightResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  const [companyCount, documentCount] = await Promise.all([
    prisma.company.count(),
    prisma.document.count(),
  ]);
  const targetEmpty = companyCount === 0 && documentCount === 0;
  if (!targetEmpty) {
    errors.push(
      'Target instance is not empty. Platform import requires an empty instance (no companies or documents).'
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
      targetAppVersion: appVersion,
      sameAppVersion: false,
      errors,
      warnings,
    };
  }

  if (!isSupportedExportFormatVersion(manifest.exportFormatVersion)) {
    errors.push(`Unsupported exportFormatVersion: ${manifest.exportFormatVersion}. Supported: 1`);
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

  try {
    const exportUsers = await readExportUsers(bundleDir);
    const overlappingEmails = await findExistingEmailsForExportUsers(prisma, exportUsers);
    if (overlappingEmails.length > 0) {
      warnings.push(
        `${overlappingEmails.length} export user(s) share an email with an existing account on this instance (${overlappingEmails.join(', ')}). Those accounts will be linked during import instead of creating duplicates.`
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
    targetAppVersion: appVersion,
    sameAppVersion,
    errors,
    warnings,
  };
}

export async function extractAndPreflightArchive(
  prisma: PrismaClient,
  archivePath: string,
  workDir: string
): Promise<{ bundleDir: string; preflight: PlatformImportPreflightResult }> {
  const bundleDir = join(workDir, 'bundle');
  await mkdir(bundleDir, { recursive: true });
  await extractZstdTarArchive(archivePath, bundleDir);
  const preflight = await runPlatformImportPreflight(prisma, bundleDir);
  return { bundleDir, preflight };
}
