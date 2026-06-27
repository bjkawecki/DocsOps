import { describe, expect, it } from 'vitest';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  PLATFORM_EXPORT_FORMAT_VERSION,
  isSupportedExportFormatVersion,
  readPlatformManifestFile,
  writePlatformManifestFile,
  sha256File,
  type PlatformExportManifest,
} from './platformManifest.js';

describe('platformManifest', () => {
  it('supports export format version 1', () => {
    expect(isSupportedExportFormatVersion(1)).toBe(true);
    expect(isSupportedExportFormatVersion(2)).toBe(false);
  });

  it('writes and reads manifest with checksum metadata', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'platform-manifest-'));
    const manifestPath = join(dir, 'manifest.json');
    const manifest: PlatformExportManifest = {
      exportFormatVersion: PLATFORM_EXPORT_FORMAT_VERSION,
      platformExportRunId: 'run1',
      sourceAppVersion: '0.1.0',
      createdAt: new Date().toISOString(),
      files: {
        'users.json': { sha256: 'abc', sizeBytes: 10 },
      },
      counts: {
        companies: 1,
        departments: 0,
        teams: 0,
        users: 1,
        owners: 0,
        contexts: 0,
        processes: 0,
        projects: 0,
        subcontexts: 0,
        documents: 0,
        documentVersions: 0,
        tags: 0,
        grants: 0,
        pins: 0,
        comments: 0,
        attachmentFiles: 0,
      },
    };
    await writePlatformManifestFile(manifestPath, manifest);
    const read = await readPlatformManifestFile(manifestPath);
    expect(read.exportFormatVersion).toBe(1);
    expect(read.platformExportRunId).toBe('run1');
    await rm(dir, { recursive: true, force: true });
  });

  it('sha256File hashes file contents', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'platform-sha-'));
    const filePath = join(dir, 'test.txt');
    await writeFile(filePath, 'hello', 'utf8');
    const hash = await sha256File(filePath);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    await rm(dir, { recursive: true, force: true });
  });
});
