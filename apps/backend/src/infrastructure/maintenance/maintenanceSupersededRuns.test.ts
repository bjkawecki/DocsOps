import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '../../db.js';
import {
  isSupersededFailedMaintenanceRun,
  purgeSupersededFailedMaintenanceRuns,
  RESTORE_SUPERSEDED_RUN_MESSAGE,
} from './maintenanceSupersededRuns.js';

describe('maintenanceSupersededRuns', () => {
  beforeEach(async () => {
    await prisma.restoreRun.deleteMany({});
    await prisma.backupRun.deleteMany({});
  });

  afterEach(async () => {
    await prisma.restoreRun.deleteMany({});
    await prisma.backupRun.deleteMany({});
  });

  it('detects superseded failed maintenance runs', () => {
    expect(
      isSupersededFailedMaintenanceRun({
        status: 'failed',
        errorMessage: RESTORE_SUPERSEDED_RUN_MESSAGE,
      })
    ).toBe(true);
    expect(
      isSupersededFailedMaintenanceRun({
        status: 'failed',
        errorMessage: 'pg_dump failed',
      })
    ).toBe(false);
  });

  it('purges superseded failed backup and restore rows', async () => {
    await prisma.backupRun.create({
      data: {
        id: 'backup-superseded',
        status: 'failed',
        triggerSource: 'manual',
        errorMessage: RESTORE_SUPERSEDED_RUN_MESSAGE,
      },
    });
    await prisma.backupRun.create({
      data: {
        id: 'backup-real-fail',
        status: 'failed',
        triggerSource: 'manual',
        errorMessage: 'boom',
      },
    });
    await prisma.restoreRun.create({
      data: {
        id: 'restore-superseded',
        status: 'failed',
        source: 'history',
        errorMessage: RESTORE_SUPERSEDED_RUN_MESSAGE,
      },
    });

    const result = await purgeSupersededFailedMaintenanceRuns(prisma);

    expect(result).toEqual({ backupRuns: 1, restoreRuns: 1 });
    expect(await prisma.backupRun.findUnique({ where: { id: 'backup-superseded' } })).toBeNull();
    expect(await prisma.backupRun.findUnique({ where: { id: 'backup-real-fail' } })).not.toBeNull();
    expect(await prisma.restoreRun.findUnique({ where: { id: 'restore-superseded' } })).toBeNull();
  });
});
