import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';

export const PLATFORM_EXPORT_FORMAT_VERSION = 1;

export const PLATFORM_EXPORT_JSON_FILES = [
  'organization.json',
  'users.json',
  'owners.json',
  'contexts.json',
  'documents.json',
  'document-versions.json',
  'grants.json',
  'tags.json',
  'pins.json',
  'comments.json',
  'suggestions.json',
  'attachments-map.json',
] as const;

export type PlatformExportManifestCounts = {
  companies: number;
  departments: number;
  teams: number;
  users: number;
  owners: number;
  contexts: number;
  processes: number;
  projects: number;
  subcontexts: number;
  documents: number;
  documentVersions: number;
  tags: number;
  grants: number;
  pins: number;
  comments: number;
  suggestions: number;
  attachmentFiles: number;
};

export type PlatformExportManifest = {
  exportFormatVersion: number;
  platformExportRunId: string;
  sourceAppVersion: string;
  createdAt: string;
  files: Record<string, { sha256: string; sizeBytes: number }>;
  counts: PlatformExportManifestCounts;
  bundleSha256?: string;
};

export async function sha256File(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    const stream = createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

export async function writePlatformManifestFile(
  filePath: string,
  manifest: PlatformExportManifest
): Promise<void> {
  await writeFile(filePath, JSON.stringify(manifest, null, 2), 'utf8');
}

export async function readPlatformManifestFile(filePath: string): Promise<PlatformExportManifest> {
  const raw = await readFile(filePath, 'utf8');
  return JSON.parse(raw) as PlatformExportManifest;
}

export async function finalizePlatformManifestBundleSha(
  manifestPath: string,
  archivePath: string
): Promise<PlatformExportManifest> {
  const manifest = await readPlatformManifestFile(manifestPath);
  manifest.bundleSha256 = await sha256File(archivePath);
  await writePlatformManifestFile(manifestPath, manifest);
  return manifest;
}

export function isSupportedExportFormatVersion(version: number): boolean {
  return version === PLATFORM_EXPORT_FORMAT_VERSION;
}
