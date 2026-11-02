import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { GrantRole } from '../../../../generated/prisma/client.js';
import { prisma } from '../../../db.js';
import { hashPassword } from '../../auth/services/password.js';
import { emptyBlockDocumentJson } from '../../documents/services/blocks/documentBlocksBackfill.js';
import {
  computeActionNeededByOwnerScope,
  notifyHealthCheckScopeCountChanges,
  notifyHealthCheckNeedsUpdate,
} from '../../documents/services/healthCheck/healthCheckNotificationService.js';
import {
  listHealthCheckLeadUserIdsForOwnerScope,
  listHealthCheckNeedsUpdateRecipientIds,
  scopeRefKey,
} from '../services/healthCheckNotificationRecipients.js';
import {
  dispatchNotificationEvent,
  getNotificationCoalesceWindowMinutes,
} from '../services/notificationDispatchService.js';
import { resolveNotificationPreferenceCategory } from '../notificationEventTypes.js';
import * as jobsClient from '../../../infrastructure/jobs/client.js';
import type { ScopeRef } from '../../organisation/permissions/scopeResolution.js';

const TS = Date.now();

describe('Do11y Phase 4 notifications', () => {
  describe('preference category', () => {
    it('maps health-check events to reminders', () => {
      expect(resolveNotificationPreferenceCategory('health-check-action-needed')).toBe('reminders');
      expect(resolveNotificationPreferenceCategory('health-check-needs-update')).toBe('reminders');
    });
  });

  describe('coalescing + prefs', () => {
    let userId: string;
    const scopeType = 'department';
    const scopeId = `dept-coa-${TS}`;

    beforeAll(async () => {
      const pw = await hashPassword('test');
      const u = await prisma.user.create({
        data: {
          name: 'HC Coalesce',
          email: `hc-coa-${TS}@test.de`,
          passwordHash: pw,
        },
      });
      userId = u.id;
    });

    afterAll(async () => {
      await prisma.$executeRaw`DELETE FROM user_notification WHERE user_id = ${userId}`;
      await prisma.session.deleteMany({ where: { userId } });
      await prisma.user.deleteMany({ where: { id: userId } });
    });

    beforeEach(async () => {
      await prisma.$executeRaw`DELETE FROM user_notification WHERE user_id = ${userId}`;
    });

    it('coalesces health-check-action-needed by owner scope and updates count 5→10', async () => {
      const prevW = process.env.NOTIFICATION_COALESCE_WINDOW_MINUTES;
      process.env.NOTIFICATION_COALESCE_WINDOW_MINUTES = '60';
      try {
        expect(getNotificationCoalesceWindowMinutes()).toBe(60);
        await dispatchNotificationEvent(prisma, {
          eventType: 'health-check-action-needed',
          targetUserIds: [userId],
          payload: { scopeType, scopeId, count: 5, kind: 'action_needed' },
        });
        await dispatchNotificationEvent(prisma, {
          eventType: 'health-check-action-needed',
          targetUserIds: [userId],
          payload: { scopeType, scopeId, count: 10, kind: 'action_needed' },
        });
        const rows = await prisma.$queryRaw<Array<{ c: bigint; count: string | null }>>`
          SELECT
            COUNT(*)::bigint AS c,
            MAX(payload->>'count') AS count
          FROM user_notification
          WHERE user_id = ${userId}
            AND event_type = 'health-check-action-needed'
        `;
        expect(Number(rows[0]?.c ?? 0n)).toBe(1);
        expect(rows[0]?.count).toBe('10');
      } finally {
        if (prevW === undefined) delete process.env.NOTIFICATION_COALESCE_WINDOW_MINUTES;
        else process.env.NOTIFICATION_COALESCE_WINDOW_MINUTES = prevW;
      }
    });

    it('respects reminders.inApp === false', async () => {
      await prisma.user.update({
        where: { id: userId },
        data: {
          preferences: {
            notificationSettings: { inApp: { reminders: false } },
          },
        },
      });
      await dispatchNotificationEvent(prisma, {
        eventType: 'health-check-action-needed',
        targetUserIds: [userId],
        payload: { scopeType, scopeId, count: 1, kind: 'action_needed' },
      });
      const rows = await prisma.$queryRaw<Array<{ c: bigint }>>`
        SELECT COUNT(*)::bigint AS c FROM user_notification WHERE user_id = ${userId}
      `;
      expect(Number(rows[0]?.c ?? 0n)).toBe(0);
      await prisma.user.update({
        where: { id: userId },
        data: { preferences: {} },
      });
    });
  });

  describe('recipients + scope notify', () => {
    let companyId: string;
    let departmentId: string;
    let teamId: string;
    let companyLeadA: string;
    let companyLeadB: string;
    let deptLeadId: string;
    let writerId: string;
    let authorId: string;
    let adminId: string;
    let companyDocId: string;
    let deptDocId: string;
    let companyOwnerId: string;
    let deptOwnerId: string;
    let companyContextId: string;
    let deptContextId: string;
    beforeAll(async () => {
      const pw = await hashPassword('test');
      const [cla, clb, dl, wr, au, ad] = await Promise.all([
        prisma.user.create({
          data: { name: 'CL A', email: `cla-${TS}@test.de`, passwordHash: pw },
        }),
        prisma.user.create({
          data: { name: 'CL B', email: `clb-${TS}@test.de`, passwordHash: pw },
        }),
        prisma.user.create({
          data: { name: 'Dept Lead', email: `dl-${TS}@test.de`, passwordHash: pw },
        }),
        prisma.user.create({
          data: { name: 'Writer', email: `wr-${TS}@test.de`, passwordHash: pw },
        }),
        prisma.user.create({
          data: { name: 'Author', email: `au-${TS}@test.de`, passwordHash: pw },
        }),
        prisma.user.create({
          data: {
            name: 'Admin',
            email: `ad-${TS}@test.de`,
            passwordHash: pw,
            isAdmin: true,
          },
        }),
      ]);
      companyLeadA = cla.id;
      companyLeadB = clb.id;
      deptLeadId = dl.id;
      writerId = wr.id;
      authorId = au.id;
      adminId = ad.id;

      const company = await prisma.company.create({ data: { name: `Co ${TS}` } });
      companyId = company.id;
      await prisma.companyLead.createMany({
        data: [
          { companyId, userId: companyLeadA },
          { companyId, userId: companyLeadB },
        ],
      });

      const department = await prisma.department.create({
        data: { name: `Dept ${TS}`, companyId },
      });
      departmentId = department.id;
      await prisma.departmentLead.create({
        data: { departmentId, userId: deptLeadId },
      });
      await prisma.departmentAuthor.create({
        data: { departmentId, userId: authorId },
      });

      const team = await prisma.team.create({
        data: { name: `Team ${TS}`, departmentId },
      });
      teamId = team.id;

      const companyOwner = await prisma.owner.create({ data: { companyId } });
      companyOwnerId = companyOwner.id;
      const companyContext = await prisma.context.create({ data: {} });
      companyContextId = companyContext.id;
      await prisma.process.create({
        data: {
          name: `Co Process ${TS}`,
          contextId: companyContextId,
          ownerId: companyOwnerId,
        },
      });

      const deptOwner = await prisma.owner.create({ data: { departmentId } });
      deptOwnerId = deptOwner.id;
      const deptContext = await prisma.context.create({ data: {} });
      deptContextId = deptContext.id;
      await prisma.process.create({
        data: {
          name: `Dept Process ${TS}`,
          contextId: deptContextId,
          ownerId: deptOwnerId,
        },
      });

      const blocks = emptyBlockDocumentJson();
      const past = new Date('2020-01-01T00:00:00.000Z');

      async function createPublished(contextId: string, title: string) {
        return prisma.$transaction(async (tx) => {
          const document = await tx.document.create({
            data: {
              title,
              draftBlocks: blocks,
              contextId,
              healthCheckNextAt: past,
              healthCheckNeedsUpdate: false,
            },
          });
          const version = await tx.documentVersion.create({
            data: {
              documentId: document.id,
              blocks,
              blocksSchemaVersion: 0,
              versionNumber: 1,
              createdById: deptLeadId,
            },
          });
          return tx.document.update({
            where: { id: document.id },
            data: {
              publishedAt: past,
              currentPublishedVersionId: version.id,
            },
          });
        });
      }

      companyDocId = (await createPublished(companyContextId, `Co Doc ${TS}`)).id;
      deptDocId = (await createPublished(deptContextId, `Dept Doc ${TS}`)).id;

      await prisma.documentGrantUser.create({
        data: { documentId: deptDocId, userId: writerId, role: GrantRole.Write },
      });
      await prisma.documentGrantUser.create({
        data: { documentId: deptDocId, userId: writerId, role: GrantRole.Read },
      });
    });

    afterAll(async () => {
      vi.restoreAllMocks();
      const docIds = [companyDocId, deptDocId].filter(Boolean);
      const userIds = [companyLeadA, companyLeadB, deptLeadId, writerId, authorId, adminId];
      for (const id of userIds) {
        await prisma.$executeRaw`DELETE FROM user_notification WHERE user_id = ${id}`;
      }
      await prisma.documentHealthCheckEvent.deleteMany({
        where: { documentId: { in: docIds } },
      });
      await prisma.documentGrantUser.deleteMany({ where: { documentId: { in: docIds } } });
      await prisma.document.updateMany({
        where: { id: { in: docIds } },
        data: { currentPublishedVersionId: null, publishedAt: null },
      });
      await prisma.documentVersion.deleteMany({ where: { documentId: { in: docIds } } });
      await prisma.document.deleteMany({ where: { id: { in: docIds } } });
      await prisma.process.deleteMany({
        where: { contextId: { in: [companyContextId, deptContextId] } },
      });
      await prisma.context.deleteMany({
        where: { id: { in: [companyContextId, deptContextId] } },
      });
      await prisma.owner.deleteMany({ where: { id: { in: [companyOwnerId, deptOwnerId] } } });
      await prisma.departmentAuthor.deleteMany({ where: { departmentId } });
      await prisma.departmentLead.deleteMany({ where: { departmentId } });
      await prisma.companyLead.deleteMany({ where: { companyId } });
      await prisma.team.deleteMany({ where: { id: teamId } });
      await prisma.department.deleteMany({ where: { id: departmentId } });
      await prisma.company.deleteMany({ where: { id: companyId } });
      await prisma.session.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    });

    it('department scope has exactly one lead; company has all company leads', async () => {
      const deptScope: ScopeRef = { type: 'department', departmentId };
      const companyScope: ScopeRef = { type: 'company', companyId };

      const deptLeads = await listHealthCheckLeadUserIdsForOwnerScope(prisma, deptScope);
      expect(deptLeads).toEqual([deptLeadId]);

      const companyLeads = await listHealthCheckLeadUserIdsForOwnerScope(prisma, companyScope);
      expect(companyLeads.sort()).toEqual([companyLeadA, companyLeadB].sort());
      expect(companyLeads).not.toContain(adminId);
    });

    it('needs-update recipients are writers/authors excluding lead', async () => {
      const targets = await listHealthCheckNeedsUpdateRecipientIds(prisma, deptDocId, deptLeadId);
      expect(targets).toContain(writerId);
      expect(targets).toContain(authorId);
      expect(targets).not.toContain(deptLeadId);
      expect(targets).not.toContain(adminId);
    });

    it('notifyHealthCheckScopeCountChanges enqueues for company leads with new count', async () => {
      const enqueueSpy = vi.spyOn(jobsClient, 'enqueueJob').mockResolvedValue('job-test-id');
      const companyScope: ScopeRef = { type: 'company', companyId };
      const key = scopeRefKey(companyScope);
      const before = new Map([[key, { scope: companyScope, count: 0 }]]);
      const after = new Map([[key, { scope: companyScope, count: 2 }]]);

      try {
        await notifyHealthCheckScopeCountChanges({
          prisma,
          before,
          after,
          actorUserId: null,
        });

        const notifCall = enqueueSpy.mock.calls.find(
          (call) =>
            call[0] === 'notifications.send' &&
            (call[1] as { eventType?: string }).eventType === 'health-check-action-needed'
        );
        expect(notifCall).toBeDefined();
        const args = notifCall![1] as {
          payload: { count: number };
          targetUserIds: string[];
        };
        expect(args.payload.count).toBe(2);
        expect(args.targetUserIds).toEqual(expect.arrayContaining([companyLeadA, companyLeadB]));
      } finally {
        enqueueSpy.mockRestore();
      }
    });

    it('same before/after counts enqueue nothing', async () => {
      const enqueueSpy = vi.spyOn(jobsClient, 'enqueueJob').mockResolvedValue('job-test-id');
      const deptScope: ScopeRef = { type: 'department', departmentId };
      const key = scopeRefKey(deptScope);
      const map = new Map([[key, { scope: deptScope, count: 3 }]]);
      try {
        await notifyHealthCheckScopeCountChanges({
          prisma,
          before: map,
          after: map,
          actorUserId: null,
        });
        expect(enqueueSpy).not.toHaveBeenCalled();
      } finally {
        enqueueSpy.mockRestore();
      }
    });

    it('computeActionNeededByOwnerScope counts due docs', async () => {
      const map = await computeActionNeededByOwnerScope(
        prisma,
        [companyContextId, deptContextId],
        new Date()
      );
      expect(map.get(scopeRefKey({ type: 'company', companyId }))?.count).toBeGreaterThanOrEqual(1);
      expect(
        map.get(scopeRefKey({ type: 'department', departmentId }))?.count
      ).toBeGreaterThanOrEqual(1);
    });

    it('notifyHealthCheckNeedsUpdate enqueues writer ping', async () => {
      const enqueueSpy = vi.spyOn(jobsClient, 'enqueueJob').mockResolvedValue('job-test-id');
      try {
        await notifyHealthCheckNeedsUpdate(prisma, deptDocId, deptLeadId);
        const notifCall = enqueueSpy.mock.calls.find(
          (call) =>
            call[0] === 'notifications.send' &&
            (call[1] as { eventType?: string }).eventType === 'health-check-needs-update'
        );
        expect(notifCall).toBeDefined();
        const args = notifCall![1] as {
          payload: { documentId: string };
          targetUserIds: string[];
        };
        expect(args.payload.documentId).toBe(deptDocId);
        expect(args.targetUserIds).toContain(writerId);
        expect(args.targetUserIds).not.toContain(deptLeadId);
      } finally {
        enqueueSpy.mockRestore();
      }
    });
  });
});
