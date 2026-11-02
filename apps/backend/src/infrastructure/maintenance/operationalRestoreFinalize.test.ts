import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '../../db.js';
import {
  finalizeOperationalRestore,
  RESTORE_SUPERSEDED_RUN_MESSAGE,
} from './operationalRestoreFinalize.js';

describe('finalizeOperationalRestore', () => {
  beforeEach(async () => {
    await prisma.session.deleteMany({});
    await prisma.restoreRun.deleteMany({});
    await prisma.backupRun.deleteMany({});
  });

  afterEach(async () => {
    await prisma.session.deleteMany({});
    await prisma.restoreRun.deleteMany({});
    await prisma.backupRun.deleteMany({});
  });

  it('invalidates sessions, removes stale backups, and removes other restore runs', async () => {
    const user = await prisma.user.create({
      data: { name: 'Restore User', email: `restore-finalize-${Date.now()}@example.com` },
    });
    await prisma.session.create({
      data: {
        id: 'session-test',
        userId: user.id,
        expiresAt: new Date(Date.now() + 86_400_000),
      },
    });
    await prisma.backupRun.create({
      data: { id: 'backup-running', status: 'running', triggerSource: 'manual' },
    });
    await prisma.restoreRun.create({
      data: { id: 'restore-done', status: 'succeeded', source: 'history', finishedAt: new Date() },
    });
    await prisma.restoreRun.create({
      data: { id: 'restore-old', status: 'running', source: 'history' },
    });
    await prisma.restoreRun.create({
      data: {
        id: 'restore-superseded-failed',
        status: 'failed',
        source: 'history',
        errorMessage: RESTORE_SUPERSEDED_RUN_MESSAGE,
        finishedAt: new Date(),
      },
    });

    const result = await finalizeOperationalRestore(prisma, 'restore-done');

    expect(result.sessionsDeleted).toBe(1);
    expect(result.removedStaleBackupRuns).toBe(1);
    expect(result.removedRestoreRuns).toBe(2);

    expect(await prisma.backupRun.findUnique({ where: { id: 'backup-running' } })).toBeNull();
    expect(await prisma.restoreRun.findUnique({ where: { id: 'restore-old' } })).toBeNull();
    expect(
      await prisma.restoreRun.findUnique({ where: { id: 'restore-superseded-failed' } })
    ).toBeNull();
    expect(await prisma.restoreRun.findUnique({ where: { id: 'restore-done' } })).not.toBeNull();
    expect(await prisma.session.count()).toBe(0);
    await prisma.user.delete({ where: { id: user.id } });
  });
});
