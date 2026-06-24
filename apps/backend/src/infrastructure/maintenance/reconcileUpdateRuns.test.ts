import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '../../db.js';
import { reconcileUpdateRunsOnStartup } from './reconcileUpdateRunsOnStartup.js';
import { resetAdminSystemUpdateCacheForTests } from '../../domains/admin/services/adminSystemUpdateService.js';

describe('reconcileUpdateRunsOnStartup', () => {
  const prevVersion = process.env.APP_VERSION;

  beforeEach(async () => {
    await prisma.systemMaintenanceLock.deleteMany();
    await prisma.updateRun.deleteMany();
    resetAdminSystemUpdateCacheForTests();
  });

  afterEach(() => {
    if (prevVersion === undefined) delete process.env.APP_VERSION;
    else process.env.APP_VERSION = prevVersion;
  });

  it('marks applying run succeeded when installed version matches target', async () => {
    process.env.APP_VERSION = '1.0.0';
    const run = await prisma.updateRun.create({
      data: {
        status: 'applying',
        targetVersion: '1.0.0',
        targetReleaseTag: 'v1.0.0',
        startedAt: new Date(),
      },
    });
    await prisma.systemMaintenanceLock.create({
      data: { id: 'backup', reason: 'update', updateRunId: run.id },
    });

    await reconcileUpdateRunsOnStartup(prisma);

    const updated = await prisma.updateRun.findUniqueOrThrow({ where: { id: run.id } });
    expect(updated.status).toBe('succeeded');
    expect(updated.finishedAt).not.toBeNull();
    const lock = await prisma.systemMaintenanceLock.findUnique({ where: { id: 'backup' } });
    expect(lock).toBeNull();
  });
});
