import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  createPlatformImportReceiveSlot,
  hashPlatformImportReceiveToken,
  PlatformImportReceiveSlotError,
  receivePlatformImportPush,
  revokePlatformImportReceiveSlot,
} from './platformImportReceiveService.js';
import { Readable } from 'node:stream';

vi.mock('../../../config/demoModeGuard.js', () => ({
  assertDemoMutationsAllowed: vi.fn(),
  DemoModeForbiddenError: class DemoModeForbiddenError extends Error {},
}));

vi.mock('../../../infrastructure/storage/index.js', () => ({
  initStorage: vi.fn(),
}));

vi.mock('../../../infrastructure/backup/archiveExtract.js', () => ({
  extractZstdTarArchive: vi.fn(),
}));

vi.mock('./platformImportService.js', () => ({
  uploadPlatformImportArchive: vi.fn().mockResolvedValue('platform-imports/uploads/run.tar.zst'),
}));

vi.mock('./platformMigration/platformImportPreflight.js', () => ({
  runPlatformImportPreflight: vi.fn().mockResolvedValue({
    ok: true,
    sameAppVersion: true,
    targetEmpty: true,
    targetAppVersion: '0.1.0',
    supportedExportFormatVersions: [1],
    blockSchemaUpgradeRequired: false,
    errors: [],
    warnings: [],
  }),
}));

import { assertDemoMutationsAllowed } from '../../../config/demoModeGuard.js';
import { initStorage } from '../../../infrastructure/storage/index.js';
import { extractZstdTarArchive } from '../../../infrastructure/backup/archiveExtract.js';

describe('platformImportReceiveService', () => {
  beforeEach(() => {
    vi.mocked(assertDemoMutationsAllowed).mockClear();
  });

  it('createPlatformImportReceiveSlot stores only the token hash', async () => {
    const created: Record<string, unknown> = {};
    const prisma = {
      company: { count: vi.fn().mockResolvedValue(0) },
      document: { count: vi.fn().mockResolvedValue(0) },
      platformImportReceiveSlot: {
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        create: vi.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) => {
          Object.assign(created, data);
          return Promise.resolve({
            id: 'slot1',
            ...data,
            usedAt: null,
            platformImportRunId: null,
            createdAt: new Date(),
          });
        }),
      },
    };

    const result = await createPlatformImportReceiveSlot(prisma as never, {
      createdByUserId: 'user1',
    });
    expect(result.token).toBeTruthy();
    expect(result.path).toContain(result.token);
    expect(created.tokenHash).toBe(hashPlatformImportReceiveToken(result.token));
    expect(created.tokenHash).not.toBe(result.token);
  });

  it('rejects create when instance is not empty', async () => {
    const prisma = {
      company: { count: vi.fn().mockResolvedValue(1) },
      document: { count: vi.fn().mockResolvedValue(0) },
    };
    await expect(
      createPlatformImportReceiveSlot(prisma as never, { createdByUserId: 'user1' })
    ).rejects.toBeInstanceOf(PlatformImportReceiveSlotError);
  });

  it('revoke rejects already used slots', async () => {
    const prisma = {
      platformImportReceiveSlot: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'slot1',
          usedAt: new Date(),
        }),
      },
    };
    await expect(revokePlatformImportReceiveSlot(prisma as never, 'slot1')).rejects.toBeInstanceOf(
      PlatformImportReceiveSlotError
    );
  });

  it('receivePlatformImportPush rejects reused tokens', async () => {
    const prisma = {
      company: { count: vi.fn().mockResolvedValue(0) },
      document: { count: vi.fn().mockResolvedValue(0) },
      platformImportReceiveSlot: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'slot1',
          tokenHash: hashPlatformImportReceiveToken('tok'),
          usedAt: new Date(),
          expiresAt: new Date(Date.now() + 60_000),
          createdByUserId: 'user1',
        }),
      },
    };
    await expect(
      receivePlatformImportPush(prisma as never, {
        token: 'tok',
        fileStream: Readable.from([]),
      })
    ).rejects.toMatchObject({ statusCode: 410 });
  });

  it('receivePlatformImportPush marks slot used after preflight', async () => {
    vi.mocked(initStorage).mockResolvedValue({
      isAvailable: vi.fn().mockResolvedValue(true),
      deleteObject: vi.fn(),
    } as never);
    vi.mocked(extractZstdTarArchive).mockResolvedValue(undefined);

    const slotUpdate = vi.fn().mockResolvedValue({});
    const runUpdate = vi.fn().mockResolvedValue({});
    const prisma = {
      company: { count: vi.fn().mockResolvedValue(0) },
      document: { count: vi.fn().mockResolvedValue(0) },
      platformImportReceiveSlot: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'slot1',
          tokenHash: hashPlatformImportReceiveToken('good-token'),
          usedAt: null,
          expiresAt: new Date(Date.now() + 60_000),
          createdByUserId: 'user1',
        }),
        update: slotUpdate,
      },
      platformImportRun: {
        create: vi.fn().mockResolvedValue({ id: 'run1' }),
        update: runUpdate,
      },
      $transaction: vi.fn().mockImplementation((ops: unknown) => Promise.resolve(ops)),
    };

    const result = await receivePlatformImportPush(prisma as never, {
      token: 'good-token',
      fileStream: Readable.from([Buffer.from('fake')]),
    });
    expect(result.platformImportRunId).toBe('run1');
    expect(result.status).toBe('awaiting_confirm');
    expect(prisma.$transaction).toHaveBeenCalled();
  });
});
