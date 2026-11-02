import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { randomUUID } from 'node:crypto';
import { prisma } from '../../../db.js';
import { hashPassword } from '../../auth/services/password.js';
import { dispatchNotificationEvent } from '../services/notificationDispatchService.js';

const TS = `org-notif-${Date.now()}`;

describe('org notification dispatch', () => {
  let userId: string;

  beforeAll(async () => {
    const pw = await hashPassword('test');
    const u = await prisma.user.create({
      data: { name: 'Org Target', email: `org-${TS}@test.de`, passwordHash: pw },
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

  it('delivers team-member-added when orgChanges in-app is enabled', async () => {
    await dispatchNotificationEvent(prisma, {
      eventType: 'team-member-added',
      targetUserIds: [userId],
      payload: {
        userId,
        scopeType: 'team',
        scopeId: 'team-1',
        scopeName: 'Engineering',
        actorUserId: 'actor-1',
      },
    });
    const rows = await prisma.$queryRaw<Array<{ event_type: string }>>`
      SELECT event_type FROM user_notification WHERE user_id = ${userId}
    `;
    expect(rows).toHaveLength(1);
    expect(rows[0]?.event_type).toBe('team-member-added');
  });

  it('skips delivery when orgChanges in-app preference is false', async () => {
    await prisma.user.update({
      where: { id: userId },
      data: {
        preferences: {
          notificationSettings: { inApp: { orgChanges: false } },
        },
      },
    });
    await dispatchNotificationEvent(prisma, {
      eventType: 'team-member-added',
      targetUserIds: [userId],
      payload: { userId, scopeType: 'team', scopeId: 't', scopeName: 'T' },
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

describe('admin broadcast dispatch', () => {
  let userId: string;

  beforeAll(async () => {
    const pw = await hashPassword('test');
    const u = await prisma.user.create({
      data: { name: 'Broadcast', email: `bc-${TS}@test.de`, passwordHash: pw },
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

  it('stores admin-broadcast notification', async () => {
    await dispatchNotificationEvent(prisma, {
      eventType: 'admin-broadcast',
      targetUserIds: [userId],
      payload: {
        broadcastId: randomUUID(),
        title: 'Maintenance',
        message: 'Scheduled downtime tonight.',
        targetKind: 'all',
        actorUserId: 'admin-1',
      },
    });
    const rows = await prisma.$queryRaw<Array<{ event_type: string; payload: unknown }>>`
      SELECT event_type, payload FROM user_notification WHERE user_id = ${userId}
    `;
    expect(rows).toHaveLength(1);
    expect(rows[0]?.event_type).toBe('admin-broadcast');
    const payload = rows[0]?.payload as { title?: string };
    expect(payload.title).toBe('Maintenance');
  });
});
