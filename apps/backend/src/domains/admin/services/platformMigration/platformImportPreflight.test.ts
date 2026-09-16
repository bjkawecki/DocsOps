import { describe, expect, it, vi } from 'vitest';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import {
  resolveMaxBlocksSchemaVersion,
  runPlatformImportPreflight,
} from './platformImportPreflight.js';
import {
  PLATFORM_EXPORT_FORMAT_VERSION,
  writePlatformManifestFile,
  type PlatformExportManifest,
  type PlatformExportManifestCounts,
} from './platformManifest.js';
import { exampleBlockDocumentV0 } from '../../../documents/services/blocks/blockSchema.js';

vi.mock('../../../../infrastructure/appVersion.js', () => ({
  appVersion: '0.1.0',
}));

const emptyCounts: PlatformExportManifestCounts = {
  companies: 0,
  departments: 0,
  teams: 0,
  users: 0,
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
};

function sha256(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

async function writeBundleFile(
  dir: string,
  name: string,
  content: string
): Promise<{ sha256: string; sizeBytes: number }> {
  const path = join(dir, name);
  await writeFile(path, content, 'utf8');
  return { sha256: sha256(content), sizeBytes: Buffer.byteLength(content, 'utf8') };
}

describe('platformImportPreflight cross-version', () => {
  it('resolveMaxBlocksSchemaVersion prefers manifest field', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'preflight-max-'));
    const manifest = {
      exportFormatVersion: 1,
      maxBlocksSchemaVersion: 1,
    } as PlatformExportManifest;
    await expect(resolveMaxBlocksSchemaVersion(dir, manifest)).resolves.toBe(1);
    await rm(dir, { recursive: true, force: true });
  });

  it('scans document JSON when manifest omits maxBlocksSchemaVersion', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'preflight-scan-'));
    await writeFile(join(dir, 'documents.json'), JSON.stringify([]), 'utf8');
    await writeFile(
      join(dir, 'document-versions.json'),
      JSON.stringify([
        {
          exportId: 'v1',
          blocks: exampleBlockDocumentV0,
          blocksSchemaVersion: 0,
        },
      ]),
      'utf8'
    );
    const manifest = { exportFormatVersion: 1 } as PlatformExportManifest;
    await expect(resolveMaxBlocksSchemaVersion(dir, manifest)).resolves.toBe(0);
    await rm(dir, { recursive: true, force: true });
  });

  it('fails preflight when maxBlocksSchemaVersion is unsupported', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'preflight-bad-'));
    const files: PlatformExportManifest['files'] = {};
    for (const name of [
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
      'attachments-map.json',
    ]) {
      const body =
        name.endsWith('map.json') || name === 'grants.json' || name === 'tags.json' ? '{}' : '[]';
      files[name] = await writeBundleFile(dir, name, body);
    }

    const manifest: PlatformExportManifest = {
      exportFormatVersion: PLATFORM_EXPORT_FORMAT_VERSION,
      platformExportRunId: 'run-bad',
      sourceAppVersion: '0.1.0',
      createdAt: new Date().toISOString(),
      files,
      counts: emptyCounts,
      maxBlocksSchemaVersion: 99,
    };
    await writePlatformManifestFile(join(dir, 'manifest.json'), manifest);

    const prisma = {
      company: { count: vi.fn().mockResolvedValue(0) },
      document: { count: vi.fn().mockResolvedValue(0) },
    };

    const result = await runPlatformImportPreflight(prisma as never, dir);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('maxBlocksSchemaVersion'))).toBe(true);
    await rm(dir, { recursive: true, force: true });
  });

  it('fails when target is not empty and merge is not enabled', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'preflight-full-'));
    const files: PlatformExportManifest['files'] = {};
    for (const name of [
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
      'attachments-map.json',
    ]) {
      const body =
        name.endsWith('map.json') || name === 'grants.json' || name === 'tags.json' ? '{}' : '[]';
      files[name] = await writeBundleFile(dir, name, body);
    }
    const usersBody = '[]';
    files['users.json'] = await writeBundleFile(dir, 'users.json', usersBody);

    const manifest: PlatformExportManifest = {
      exportFormatVersion: PLATFORM_EXPORT_FORMAT_VERSION,
      platformExportRunId: 'run-full',
      sourceAppVersion: '0.1.0',
      createdAt: new Date().toISOString(),
      files,
      counts: emptyCounts,
      maxBlocksSchemaVersion: 1,
    };
    await writePlatformManifestFile(join(dir, 'manifest.json'), manifest);

    const prisma = {
      company: { count: vi.fn().mockResolvedValue(1) },
      document: { count: vi.fn().mockResolvedValue(0) },
      user: { findMany: vi.fn().mockResolvedValue([]) },
    };

    const blocked = await runPlatformImportPreflight(prisma as never, dir);
    expect(blocked.ok).toBe(false);
    expect(blocked.requiresMerge).toBe(true);
    expect(blocked.errors.some((e) => e.includes('not empty'))).toBe(true);

    const soft = await runPlatformImportPreflight(prisma as never, dir, {
      enforceEmpty: false,
    });
    expect(soft.ok).toBe(true);
    expect(soft.requiresMerge).toBe(true);
    expect(soft.warnings.some((w) => w.includes('not empty'))).toBe(true);

    const merged = await runPlatformImportPreflight(prisma as never, dir, { merge: true });
    expect(merged.ok).toBe(true);
    expect(merged.warnings.some((w) => w.includes('Merge import enabled'))).toBe(true);

    await rm(dir, { recursive: true, force: true });
  });
});
