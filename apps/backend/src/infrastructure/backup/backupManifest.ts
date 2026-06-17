import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';

export const BACKUP_FORMAT_VERSION = 1;

export type BackupManifest = {
  backupFormatVersion: number;
  backupRunId: string;
  createdAt: string;
  appVersion: string;
  postgres: { path: string; sizeBytes: number; sha256: string };
  minio: { objectCount: number; totalSizeBytes: number; prefix: string };
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

export async function writeManifestFile(filePath: string, manifest: BackupManifest): Promise<void> {
  await writeFile(filePath, JSON.stringify(manifest, null, 2), 'utf8');
}

export async function readManifestFile(filePath: string): Promise<BackupManifest> {
  const raw = await readFile(filePath, 'utf8');
  return JSON.parse(raw) as BackupManifest;
}

export async function finalizeManifestBundleSha(
  manifestPath: string,
  archivePath: string
): Promise<BackupManifest> {
  const manifest = await readManifestFile(manifestPath);
  manifest.bundleSha256 = await sha256File(archivePath);
  await writeManifestFile(manifestPath, manifest);
  return manifest;
}
