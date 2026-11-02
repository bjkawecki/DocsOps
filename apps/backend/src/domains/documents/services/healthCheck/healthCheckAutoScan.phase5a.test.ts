import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { prisma } from '../../../../db.js';
import { hashPassword } from '../../../auth/services/password.js';
import { emptyBlockDocumentJson } from '../blocks/documentBlocksBackfill.js';
import * as jobsClient from '../../../../infrastructure/jobs/client.js';
import { jobDefinitions } from '../../../../infrastructure/jobs/jobRegistry.js';
import {
  runOrgHealthCheckAutoScan,
  isHealthCheckAutoScanEnabled,
} from './healthCheckAutoScanService.js';
import {
  HEALTH_CHECK_AUTO_SCAN_DEFAULT_CRON,
  HEALTH_CHECK_AUTO_SCAN_SCHEDULE_KEY,
  getHealthCheckAutoScanCron,
  syncHealthCheckAutoScanSchedule,
} from './healthCheckAutoScanSchedule.js';

const TS = Date.now();
const PASSWORD = 'testpass';

describe('Do11y Phase 5a auto-scan', () => {
  describe('cron SSoT', () => {
    it('uses default cron when env unset', () => {
      const prev = process.env.HEALTH_CHECK_AUTO_SCAN_CRON;
      delete process.env.HEALTH_CHECK_AUTO_SCAN_CRON;
      try {
        expect(getHealthCheckAutoScanCron()).toBe(HEALTH_CHECK_AUTO_SCAN_DEFAULT_CRON);
      } finally {
        if (prev === undefined) delete process.env.HEALTH_CHECK_AUTO_SCAN_CRON;
        else process.env.HEALTH_CHECK_AUTO_SCAN_CRON = prev;
      }
    });

    it('uses env when set', () => {
      const prev = process.env.HEALTH_CHECK_AUTO_SCAN_CRON;
      process.env.HEALTH_CHECK_AUTO_SCAN_CRON = '15 4 * * *';
      try {
        expect(getHealthCheckAutoScanCron()).toBe('15 4 * * *');
      } finally {
        if (prev === undefined) delete process.env.HEALTH_CHECK_AUTO_SCAN_CRON;
        else process.env.HEALTH_CHECK_AUTO_SCAN_CRON = prev;
      }
    });
  });

  describe('schedule sync', () => {
    it('upserts schedule when enabled and removes when disabled', async () => {
      const upsertSpy = vi.spyOn(jobsClient, 'upsertSchedule').mockResolvedValue(undefined);
      const removeSpy = vi.spyOn(jobsClient, 'removeSchedule').mockResolvedValue(undefined);
      try {
        await syncHealthCheckAutoScanSchedule(true);
        expect(upsertSpy).toHaveBeenCalledWith({
          jobType: 'docs.health-check.auto-scan',
          cron: getHealthCheckAutoScanCron(),
          key: HEALTH_CHECK_AUTO_SCAN_SCHEDULE_KEY,
          payload: { reason: 'scheduled' },
        });
        await syncHealthCheckAutoScanSchedule(false);
        expect(removeSpy).toHaveBeenCalledWith(
          'docs.health-check.auto-scan',
          HEALTH_CHECK_AUTO_SCAN_SCHEDULE_KEY
        );
      } finally {
        upsertSpy.mockRestore();
        removeSpy.mockRestore();
      }
    });
  });

  describe('org scan + job handler', () => {
    let companyId: string;
    let departmentId: string;
    let teamOwnerId: string;
    let personalOwnerId: string;
    let orgContextId: string;
    let personalContextId: string;
    let orgDocMissingNextAtId: string;
    let orgDocExpiredSnoozeId: string;
    let orgDocStableId: string;
    let personalDocId: string;
    let leadUserId: string;
    let personalUserId: string;

    beforeAll(async () => {
      const pw = await hashPassword(PASSWORD);
      const lead = await prisma.user.create({
        data: {
          name: 'HC Auto Lead',
          email: `hc-auto-lead-${TS}@test.de`,
          passwordHash: pw,
        },
      });
      const personalUser = await prisma.user.create({
        data: {
          name: 'HC Auto Personal',
          email: `hc-auto-pers-${TS}@test.de`,
          passwordHash: pw,
        },
      });
      leadUserId = lead.id;
      personalUserId = personalUser.id;

      const company = await prisma.company.create({ data: { name: `HC Auto Co ${TS}` } });
      companyId = company.id;
      const department = await prisma.department.create({
        data: { name: `HC Auto Dept ${TS}`, companyId },
      });
      departmentId = department.id;
      await prisma.departmentLead.create({
        data: { userId: leadUserId, departmentId },
      });

      const teamOwner = await prisma.owner.create({ data: { departmentId } });
      teamOwnerId = teamOwner.id;
      const orgContext = await prisma.context.create({ data: {} });
      orgContextId = orgContext.id;
      await prisma.process.create({
        data: {
          name: `HC Auto Process ${TS}`,
          contextId: orgContextId,
          ownerId: teamOwnerId,
        },
      });

      const personalOwner = await prisma.owner.create({
        data: { ownerUserId: personalUserId },
      });
      personalOwnerId = personalOwner.id;
      const personalContext = await prisma.context.create({ data: {} });
      personalContextId = personalContext.id;
      await prisma.process.create({
        data: {
          name: `HC Auto Personal Process ${TS}`,
          contextId: personalContextId,
          ownerId: personalOwnerId,
        },
      });

      const blocks = emptyBlockDocumentJson();
      const publishedAt = new Date('2019-01-01T00:00:00.000Z');

      async function createPublished(
        title: string,
        contextId: string,
        extra: Record<string, unknown> = {}
      ) {
        return prisma.$transaction(async (tx) => {
          const document = await tx.document.create({
            data: {
              title,
              draftBlocks: blocks,
              contextId,
              ...extra,
            },
          });
          const version = await tx.documentVersion.create({
            data: {
              documentId: document.id,
              blocks,
              blocksSchemaVersion: 0,
              versionNumber: 1,
              createdById: leadUserId,
            },
          });
          return tx.document.update({
            where: { id: document.id },
            data: {
              publishedAt,
              currentPublishedVersionId: version.id,
              ...extra,
            },
          });
        });
      }

      const missing = await createPublished(`HC Auto Missing ${TS}`, orgContextId, {
        healthCheckNextAt: null,
      });
      orgDocMissingNextAtId = missing.id;

      const expired = await createPublished(`HC Auto Snooze ${TS}`, orgContextId, {
        healthCheckNextAt: new Date('2030-01-01T00:00:00.000Z'),
        healthCheckSnoozedUntil: new Date('2020-06-01T00:00:00.000Z'),
      });
      orgDocExpiredSnoozeId = expired.id;

      const stable = await createPublished(`HC Auto Stable ${TS}`, orgContextId, {
        healthCheckNextAt: new Date('2030-06-01T00:00:00.000Z'),
        healthCheckSnoozedUntil: null,
        healthCheckNeedsUpdate: false,
      });
      orgDocStableId = stable.id;

      const personal = await createPublished(`HC Auto Personal Doc ${TS}`, personalContextId, {
        healthCheckNextAt: null,
      });
      personalDocId = personal.id;
    });

    afterAll(async () => {
      const docIds = [
        orgDocMissingNextAtId,
        orgDocExpiredSnoozeId,
        orgDocStableId,
        personalDocId,
      ].filter(Boolean);
      await prisma.document.updateMany({
        where: { id: { in: docIds } },
        data: { currentPublishedVersionId: null, publishedAt: null },
      });
      await prisma.documentVersion.deleteMany({ where: { documentId: { in: docIds } } });
      await prisma.document.deleteMany({ where: { id: { in: docIds } } });
      await prisma.process.deleteMany({
        where: { contextId: { in: [orgContextId, personalContextId] } },
      });
      await prisma.context.deleteMany({ where: { id: { in: [orgContextId, personalContextId] } } });
      await prisma.owner.deleteMany({ where: { id: { in: [teamOwnerId, personalOwnerId] } } });
      await prisma.departmentLead.deleteMany({ where: { departmentId } });
      await prisma.department.deleteMany({ where: { id: departmentId } });
      await prisma.company.deleteMany({ where: { id: companyId } });
      await prisma.session.deleteMany({
        where: { userId: { in: [leadUserId, personalUserId] } },
      });
      await prisma.user.deleteMany({ where: { id: { in: [leadUserId, personalUserId] } } });
    });

    beforeEach(async () => {
      await prisma.systemSettings.upsert({
        where: { id: 'default' },
        create: {
          id: 'default',
          healthCheckDefaultIntervalDays: 90,
          healthCheckAutoScanEnabled: false,
        },
        update: {
          healthCheckDefaultIntervalDays: 90,
          healthCheckAutoScanEnabled: false,
        },
      });
      await prisma.document.update({
        where: { id: orgDocMissingNextAtId },
        data: { healthCheckNextAt: null, healthCheckSnoozedUntil: null },
      });
      await prisma.document.update({
        where: { id: orgDocExpiredSnoozeId },
        data: {
          healthCheckNextAt: new Date('2030-01-01T00:00:00.000Z'),
          healthCheckSnoozedUntil: new Date('2020-06-01T00:00:00.000Z'),
        },
      });
      await prisma.document.update({
        where: { id: personalDocId },
        data: { healthCheckNextAt: null },
      });
    });

    it('isHealthCheckAutoScanEnabled follows SystemSettings', async () => {
      expect(await isHealthCheckAutoScanEnabled(prisma)).toBe(false);
      await prisma.systemSettings.update({
        where: { id: 'default' },
        data: { healthCheckAutoScanEnabled: true },
      });
      expect(await isHealthCheckAutoScanEnabled(prisma)).toBe(true);
    });

    it('job handler no-ops when flag is false', async () => {
      const def = jobDefinitions.find((d) => d.name === 'docs.health-check.auto-scan');
      expect(def).toBeDefined();
      const enqueueSpy = vi.spyOn(jobsClient, 'enqueueJob').mockResolvedValue('job-test-id');
      const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
      try {
        await def!.handler({ reason: 'scheduled' }, { prisma, logger });
        const personal = await prisma.document.findUniqueOrThrow({
          where: { id: personalDocId },
          select: { healthCheckNextAt: true },
        });
        const orgMissing = await prisma.document.findUniqueOrThrow({
          where: { id: orgDocMissingNextAtId },
          select: { healthCheckNextAt: true },
        });
        expect(personal.healthCheckNextAt).toBeNull();
        expect(orgMissing.healthCheckNextAt).toBeNull();
        expect(enqueueSpy).not.toHaveBeenCalled();
        expect(logger.info).toHaveBeenCalledWith(
          expect.anything(),
          expect.stringContaining('skipped')
        );
      } finally {
        enqueueSpy.mockRestore();
      }
    });

    it('sets missing nextAt and clears expired snooze; skips personal docs', async () => {
      const result = await runOrgHealthCheckAutoScan(prisma, new Date('2024-06-01T12:00:00.000Z'));
      expect(result.updatedDocumentIds).toEqual(
        expect.arrayContaining([orgDocMissingNextAtId, orgDocExpiredSnoozeId])
      );
      expect(result.updatedDocumentIds).not.toContain(personalDocId);
      expect(result.skippedPersonal).toBeGreaterThanOrEqual(1);

      const orgMissing = await prisma.document.findUniqueOrThrow({
        where: { id: orgDocMissingNextAtId },
        select: { healthCheckNextAt: true },
      });
      expect(orgMissing.healthCheckNextAt).not.toBeNull();

      const snoozeDoc = await prisma.document.findUniqueOrThrow({
        where: { id: orgDocExpiredSnoozeId },
        select: { healthCheckSnoozedUntil: true },
      });
      expect(snoozeDoc.healthCheckSnoozedUntil).toBeNull();

      const personal = await prisma.document.findUniqueOrThrow({
        where: { id: personalDocId },
        select: { healthCheckNextAt: true },
      });
      expect(personal.healthCheckNextAt).toBeNull();
    });

    it('enqueues notifications when action_needed counts change', async () => {
      // Null nextAt is not yet action_needed; materialize with old publishedAt → due (0→1).
      // Neutralize expired-snooze doc so before/after are not a 1→1 swap.
      await prisma.document.update({
        where: { id: orgDocExpiredSnoozeId },
        data: {
          healthCheckNextAt: new Date('2030-01-01T00:00:00.000Z'),
          healthCheckSnoozedUntil: null,
        },
      });
      const enqueueSpy = vi.spyOn(jobsClient, 'enqueueJob').mockResolvedValue('job-test-id');
      try {
        await runOrgHealthCheckAutoScan(prisma, new Date('2024-06-01T12:00:00.000Z'));
        const notifCall = enqueueSpy.mock.calls.find(
          (call) =>
            call[0] === 'notifications.send' &&
            (call[1] as { eventType?: string }).eventType === 'health-check-action-needed'
        );
        expect(notifCall).toBeDefined();
        const payload = notifCall![1] as { targetUserIds: string[] };
        expect(payload.targetUserIds).toContain(leadUserId);
      } finally {
        enqueueSpy.mockRestore();
      }
    });

    it('does not enqueue when scan produces no count diff', async () => {
      // First pass materializes; second pass on already-stable set should be quiet.
      await runOrgHealthCheckAutoScan(prisma, new Date('2024-06-01T12:00:00.000Z'));
      await prisma.document.update({
        where: { id: orgDocMissingNextAtId },
        data: { healthCheckNextAt: new Date('2030-01-01T00:00:00.000Z') },
      });
      await prisma.document.update({
        where: { id: orgDocExpiredSnoozeId },
        data: {
          healthCheckNextAt: new Date('2030-01-01T00:00:00.000Z'),
          healthCheckSnoozedUntil: null,
        },
      });

      const enqueueSpy = vi.spyOn(jobsClient, 'enqueueJob').mockResolvedValue('job-test-id');
      try {
        await runOrgHealthCheckAutoScan(prisma, new Date('2024-06-01T12:00:00.000Z'));
        expect(enqueueSpy).not.toHaveBeenCalled();
      } finally {
        enqueueSpy.mockRestore();
      }
    });

    it('job handler runs scan when flag is true', async () => {
      await prisma.systemSettings.update({
        where: { id: 'default' },
        data: { healthCheckAutoScanEnabled: true },
      });
      const def = jobDefinitions.find((d) => d.name === 'docs.health-check.auto-scan');
      expect(def).toBeDefined();
      const enqueueSpy = vi.spyOn(jobsClient, 'enqueueJob').mockResolvedValue('job-test-id');
      const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
      try {
        await def!.handler({ reason: 'manual' }, { prisma, logger });
        const orgMissing = await prisma.document.findUniqueOrThrow({
          where: { id: orgDocMissingNextAtId },
          select: { healthCheckNextAt: true },
        });
        expect(orgMissing.healthCheckNextAt).not.toBeNull();
        expect(logger.info).toHaveBeenCalledWith(
          expect.anything(),
          expect.stringContaining('completed')
        );
      } finally {
        enqueueSpy.mockRestore();
      }
    });
  });
});
