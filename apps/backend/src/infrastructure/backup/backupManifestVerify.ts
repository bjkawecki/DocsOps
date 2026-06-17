import { join } from 'node:path';
import {
  BACKUP_FORMAT_VERSION,
  readManifestFile,
  sha256File,
  type BackupManifest,
} from './backupManifest.js';

export async function verifyBackupBundle(
  bundleDir: string
): Promise<{ manifest: BackupManifest; dumpPath: string; minioObjectsDir: string }> {
  const manifestPath = join(bundleDir, 'manifest.json');
  const manifest = await readManifestFile(manifestPath);

  if (manifest.backupFormatVersion !== BACKUP_FORMAT_VERSION) {
    throw new Error(
      `Unsupported backup format version ${manifest.backupFormatVersion} (expected ${BACKUP_FORMAT_VERSION})`
    );
  }

  const dumpPath = join(bundleDir, manifest.postgres.path);
  const dumpSha = await sha256File(dumpPath);
  if (dumpSha !== manifest.postgres.sha256) {
    throw new Error('PostgreSQL dump checksum mismatch');
  }

  const minioObjectsDir = join(bundleDir, manifest.minio.prefix);
  return { manifest, dumpPath, minioObjectsDir };
}
