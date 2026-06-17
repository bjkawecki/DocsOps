import { randomUUID } from 'node:crypto';
import { Prisma, type PrismaClient } from '../../../../generated/prisma/client.js';
import type { AdminBroadcastTargetKind } from '../schemas/notifications.js';
import { enqueueNotificationEvent } from '../../notifications/services/notificationEnqueueService.js';

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
  const targetUserIds = await resolveBroadcastTargetUserIds(prisma, args.targetKind, args.userIds);
  const broadcastId = randomUUID();
  const targetPayload = args.targetKind === 'users' ? { userIds: args.userIds ?? [] } : {};

  await prisma.$executeRaw(Prisma.sql`
    INSERT INTO admin_notification_broadcast (
      id,
      actor_user_id,
      title,
      message,
      target_kind,
      target_payload,
      delivered_count,
      created_at
    )
    VALUES (
      ${broadcastId},
      ${args.actorUserId},
      ${args.title},
      ${args.message},
      ${args.targetKind},
      ${JSON.stringify(targetPayload)}::jsonb,
      ${targetUserIds.length},
      NOW()
    )
  `);

  if (targetUserIds.length > 0) {
    await enqueueNotificationEvent({
      eventType: 'admin-broadcast',
      targetUserIds,
      payload: {
        broadcastId,
        title: args.title,
        message: args.message,
        targetKind: args.targetKind,
        actorUserId: args.actorUserId,
      },
    });
  }

  return {
    broadcastId,
    deliveredCount: targetUserIds.length,
    targetUserCount: targetUserIds.length,
  };
}

export async function listAdminBroadcastHistory(
  prisma: PrismaClient,
  limit: number,
  offset: number
): Promise<{
  items: Array<{
    id: string;
    actorUserId: string;
    title: string;
    message: string;
    targetKind: string;
    deliveredCount: number;
    createdAt: Date;
  }>;
  total: number;
}> {
  const rows = await prisma.$queryRaw<
    Array<{
      id: string;
      actor_user_id: string;
      title: string;
      message: string;
      target_kind: string;
      delivered_count: number;
      created_at: Date;
    }>
  >(Prisma.sql`
    SELECT id, actor_user_id, title, message, target_kind, delivered_count, created_at
    FROM admin_notification_broadcast
    ORDER BY created_at DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `);
  const countRows = await prisma.$queryRaw<Array<{ c: bigint }>>(Prisma.sql`
    SELECT COUNT(*)::bigint AS c FROM admin_notification_broadcast
  `);
  return {
    items: rows.map((row) => ({
      id: row.id,
      actorUserId: row.actor_user_id,
      title: row.title,
      message: row.message,
      targetKind: row.target_kind,
      deliveredCount: row.delivered_count,
      createdAt: row.created_at,
    })),
    total: Number(countRows[0]?.c ?? 0n),
  };
}
