import { randomUUID } from 'node:crypto';
import { Prisma, type PrismaClient } from '../../../../generated/prisma/client.js';
import type { AdminBroadcastTargetKind } from '../schemas/notifications.js';
import { enqueueNotificationEvent } from '../../notifications/services/notificationEnqueueService.js';
import { cancelJob, enqueueJob } from '../../../infrastructure/jobs/client.js';

export const ADMIN_BROADCAST_JOB = 'notifications.admin-broadcast' as const;

export type AdminBroadcastStatus = 'scheduled' | 'sent' | 'cancelled';

export function adminBroadcastJobKey(broadcastId: string): string {
  return `broadcast-${broadcastId}`;
}

export async function resolveBroadcastTargetUserIds(
  prisma: PrismaClient,
  targetKind: AdminBroadcastTargetKind,
  userIds?: string[]
): Promise<string[]> {
  if (targetKind === 'users') {
    const ids = userIds ?? [];
    if (ids.length === 0) return [];
    const rows = await prisma.user.findMany({
      where: { id: { in: ids }, deletedAt: null },
      select: { id: true },
    });
    return rows.map((r) => r.id);
  }

  if (targetKind === 'all') {
    const rows = await prisma.user.findMany({
      where: { deletedAt: null },
      select: { id: true },
    });
    return rows.map((r) => r.id);
  }

  if (targetKind === 'admins') {
    const rows = await prisma.user.findMany({
      where: { isAdmin: true, deletedAt: null },
      select: { id: true },
    });
    return rows.map((r) => r.id);
  }

  if (targetKind === 'company_leads') {
    const rows = await prisma.companyLead.findMany({
      where: { user: { deletedAt: null } },
      select: { userId: true },
    });
    return [...new Set(rows.map((r) => r.userId))];
  }

  if (targetKind === 'department_leads') {
    const rows = await prisma.departmentLead.findMany({
      where: { user: { deletedAt: null } },
      select: { userId: true },
    });
    return [...new Set(rows.map((r) => r.userId))];
  }

  if (targetKind === 'team_leads') {
    const rows = await prisma.teamLead.findMany({
      where: { user: { deletedAt: null } },
      select: { userId: true },
    });
    return [...new Set(rows.map((r) => r.userId))];
  }

  return [];
}

type AdminBroadcastRow = {
  id: string;
  actor_user_id: string;
  title: string;
  message: string;
  target_kind: AdminBroadcastTargetKind;
  target_payload: { userIds?: string[] };
  status: AdminBroadcastStatus;
  scheduled_at: Date | null;
  sent_at: Date | null;
  delivered_count: number;
  job_id: string | null;
  created_at: Date;
};

async function getAdminBroadcastRowById(
  prisma: PrismaClient,
  broadcastId: string
): Promise<AdminBroadcastRow | null> {
  const rows = await prisma.$queryRaw<AdminBroadcastRow[]>(Prisma.sql`
    SELECT
      id,
      actor_user_id,
      title,
      message,
      target_kind,
      target_payload,
      status,
      scheduled_at,
      sent_at,
      delivered_count,
      job_id,
      created_at
    FROM admin_notification_broadcast
    WHERE id = ${broadcastId}
    LIMIT 1
  `);
  return rows[0] ?? null;
}

async function insertAdminBroadcastRow(
  prisma: PrismaClient,
  args: {
    broadcastId: string;
    actorUserId: string;
    title: string;
    message: string;
    targetKind: AdminBroadcastTargetKind;
    userIds?: string[];
    status: AdminBroadcastStatus;
    scheduledAt?: Date | null;
    sentAt?: Date | null;
    deliveredCount: number;
    jobId?: string | null;
  }
): Promise<void> {
  const targetPayload = args.targetKind === 'users' ? { userIds: args.userIds ?? [] } : {};
  await prisma.$executeRaw(Prisma.sql`
    INSERT INTO admin_notification_broadcast (
      id,
      actor_user_id,
      title,
      message,
      target_kind,
      target_payload,
      status,
      scheduled_at,
      sent_at,
      delivered_count,
      job_id,
      created_at
    )
    VALUES (
      ${args.broadcastId},
      ${args.actorUserId},
      ${args.title},
      ${args.message},
      ${args.targetKind},
      ${JSON.stringify(targetPayload)}::jsonb,
      ${args.status},
      ${args.scheduledAt ?? null},
      ${args.sentAt ?? null},
      ${args.deliveredCount},
      ${args.jobId ?? null},
      NOW()
    )
  `);
}

export async function deliverAdminBroadcastById(
  prisma: PrismaClient,
  broadcastId: string
): Promise<{ broadcastId: string; deliveredCount: number }> {
  const row = await getAdminBroadcastRowById(prisma, broadcastId);
  if (!row) {
    throw new Error('Broadcast not found');
  }
  if (row.status === 'cancelled') {
    throw new Error('Broadcast was cancelled');
  }
  if (row.status === 'sent') {
    return { broadcastId, deliveredCount: row.delivered_count };
  }

  const userIds = row.target_kind === 'users' ? (row.target_payload.userIds ?? []) : undefined;
  const targetUserIds = await resolveBroadcastTargetUserIds(prisma, row.target_kind, userIds);

  if (targetUserIds.length > 0) {
    await enqueueNotificationEvent({
      eventType: 'admin-broadcast',
      targetUserIds,
      payload: {
        broadcastId,
        title: row.title,
        message: row.message,
        targetKind: row.target_kind,
        actorUserId: row.actor_user_id,
      },
    });
  }

  await prisma.$executeRaw(Prisma.sql`
    UPDATE admin_notification_broadcast
    SET
      status = 'sent',
      sent_at = NOW(),
      scheduled_at = NULL,
      delivered_count = ${targetUserIds.length},
      job_id = NULL
    WHERE id = ${broadcastId}
  `);

  return { broadcastId, deliveredCount: targetUserIds.length };
}

export async function createAdminBroadcast(
  prisma: PrismaClient,
  args: {
    actorUserId: string;
    title: string;
    message: string;
    targetKind: AdminBroadcastTargetKind;
    userIds?: string[];
    sendAt?: Date | null;
  }
): Promise<{
  broadcastId: string;
  status: AdminBroadcastStatus;
  deliveredCount: number;
  scheduledAt: string | null;
}> {
  const broadcastId = randomUUID();
  const now = Date.now();
  const sendAt = args.sendAt ?? null;
  const isScheduled = sendAt != null && sendAt.getTime() > now + 1000;

  if (isScheduled && sendAt != null) {
    await insertAdminBroadcastRow(prisma, {
      broadcastId,
      actorUserId: args.actorUserId,
      title: args.title,
      message: args.message,
      targetKind: args.targetKind,
      userIds: args.userIds,
      status: 'scheduled',
      scheduledAt: sendAt,
      deliveredCount: 0,
    });

    const jobId = await enqueueJob(
      ADMIN_BROADCAST_JOB,
      { broadcastId },
      { startAfter: sendAt, singletonKey: adminBroadcastJobKey(broadcastId) }
    );

    await prisma.$executeRaw(Prisma.sql`
      UPDATE admin_notification_broadcast
      SET job_id = ${jobId}
      WHERE id = ${broadcastId}
    `);

    return {
      broadcastId,
      status: 'scheduled',
      deliveredCount: 0,
      scheduledAt: sendAt.toISOString(),
    };
  }

  await insertAdminBroadcastRow(prisma, {
    broadcastId,
    actorUserId: args.actorUserId,
    title: args.title,
    message: args.message,
    targetKind: args.targetKind,
    userIds: args.userIds,
    status: 'scheduled',
    scheduledAt: null,
    deliveredCount: 0,
  });

  const delivered = await deliverAdminBroadcastById(prisma, broadcastId);
  return {
    broadcastId,
    status: 'sent',
    deliveredCount: delivered.deliveredCount,
    scheduledAt: null,
  };
}

/** @deprecated use createAdminBroadcast */
export async function sendAdminBroadcast(
  prisma: PrismaClient,
  args: {
    actorUserId: string;
    title: string;
    message: string;
    targetKind: AdminBroadcastTargetKind;
    userIds?: string[];
  }
): Promise<{ broadcastId: string; deliveredCount: number; targetUserCount: number }> {
  const result = await createAdminBroadcast(prisma, args);
  return {
    broadcastId: result.broadcastId,
    deliveredCount: result.deliveredCount,
    targetUserCount: result.deliveredCount,
  };
}

export async function listAdminBroadcastHistory(
  prisma: PrismaClient,
  limit: number,
  offset: number,
  status: AdminBroadcastStatus | 'all' = 'sent'
): Promise<{
  items: Array<{
    id: string;
    actorUserId: string;
    title: string;
    message: string;
    targetKind: string;
    status: AdminBroadcastStatus;
    deliveredCount: number;
    createdAt: Date;
    scheduledAt: Date | null;
    sentAt: Date | null;
  }>;
  total: number;
}> {
  const statusFilter = status === 'all' ? Prisma.empty : Prisma.sql`AND status = ${status}`;

  const rows = await prisma.$queryRaw<
    Array<{
      id: string;
      actor_user_id: string;
      title: string;
      message: string;
      target_kind: string;
      status: AdminBroadcastStatus;
      delivered_count: number;
      created_at: Date;
      scheduled_at: Date | null;
      sent_at: Date | null;
    }>
  >(Prisma.sql`
    SELECT
      id,
      actor_user_id,
      title,
      message,
      target_kind,
      status,
      delivered_count,
      created_at,
      scheduled_at,
      sent_at
    FROM admin_notification_broadcast
    WHERE 1 = 1
    ${statusFilter}
    ORDER BY COALESCE(sent_at, scheduled_at, created_at) DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `);

  const countRows = await prisma.$queryRaw<Array<{ c: bigint }>>(Prisma.sql`
    SELECT COUNT(*)::bigint AS c
    FROM admin_notification_broadcast
    WHERE 1 = 1
    ${statusFilter}
  `);

  return {
    items: rows.map((row) => ({
      id: row.id,
      actorUserId: row.actor_user_id,
      title: row.title,
      message: row.message,
      targetKind: row.target_kind,
      status: row.status,
      deliveredCount: row.delivered_count,
      createdAt: row.created_at,
      scheduledAt: row.scheduled_at,
      sentAt: row.sent_at,
    })),
    total: Number(countRows[0]?.c ?? 0n),
  };
}

export async function listScheduledAdminBroadcasts(prisma: PrismaClient): Promise<
  Array<{
    id: string;
    title: string;
    message: string;
    targetKind: AdminBroadcastTargetKind;
    scheduledAt: Date;
    actorUserId: string;
  }>
> {
  const rows = await prisma.$queryRaw<
    Array<{
      id: string;
      actor_user_id: string;
      title: string;
      message: string;
      target_kind: AdminBroadcastTargetKind;
      scheduled_at: Date;
    }>
  >(Prisma.sql`
    SELECT id, actor_user_id, title, message, target_kind, scheduled_at
    FROM admin_notification_broadcast
    WHERE status = 'scheduled'
    ORDER BY scheduled_at ASC
  `);

  return rows.map((row) => ({
    id: row.id,
    actorUserId: row.actor_user_id,
    title: row.title,
    message: row.message,
    targetKind: row.target_kind,
    scheduledAt: row.scheduled_at,
  }));
}

async function cancelScheduledBroadcastJob(row: AdminBroadcastRow): Promise<void> {
  if (row.job_id) {
    try {
      await cancelJob(ADMIN_BROADCAST_JOB, row.job_id);
    } catch {
      /* job may already be running or gone */
    }
  }
}

export async function cancelScheduledAdminBroadcast(
  prisma: PrismaClient,
  broadcastId: string
): Promise<void> {
  const row = await getAdminBroadcastRowById(prisma, broadcastId);
  if (!row) throw new Error('Broadcast not found');
  if (row.status !== 'scheduled') {
    throw new Error('Only scheduled broadcasts can be cancelled');
  }
  await cancelScheduledBroadcastJob(row);
  await prisma.$executeRaw(Prisma.sql`
    UPDATE admin_notification_broadcast
    SET status = 'cancelled', scheduled_at = NULL, job_id = NULL
    WHERE id = ${broadcastId}
  `);
}

export async function rescheduleScheduledAdminBroadcast(
  prisma: PrismaClient,
  broadcastId: string,
  sendAt: Date
): Promise<{ scheduledAt: string }> {
  const row = await getAdminBroadcastRowById(prisma, broadcastId);
  if (!row) throw new Error('Broadcast not found');
  if (row.status !== 'scheduled') {
    throw new Error('Only scheduled broadcasts can be rescheduled');
  }
  if (sendAt.getTime() <= Date.now() + 1000) {
    throw new Error('Scheduled time must be in the future');
  }

  await cancelScheduledBroadcastJob(row);

  const jobId = await enqueueJob(
    ADMIN_BROADCAST_JOB,
    { broadcastId },
    { startAfter: sendAt, singletonKey: adminBroadcastJobKey(broadcastId) }
  );

  await prisma.$executeRaw(Prisma.sql`
    UPDATE admin_notification_broadcast
    SET scheduled_at = ${sendAt}, job_id = ${jobId}
    WHERE id = ${broadcastId}
  `);

  return { scheduledAt: sendAt.toISOString() };
}

export async function sendScheduledAdminBroadcastNow(
  prisma: PrismaClient,
  broadcastId: string
): Promise<{ deliveredCount: number }> {
  const row = await getAdminBroadcastRowById(prisma, broadcastId);
  if (!row) throw new Error('Broadcast not found');
  if (row.status !== 'scheduled') {
    throw new Error('Only scheduled broadcasts can be sent now');
  }
  await cancelScheduledBroadcastJob(row);
  const result = await deliverAdminBroadcastById(prisma, broadcastId);
  return { deliveredCount: result.deliveredCount };
}
