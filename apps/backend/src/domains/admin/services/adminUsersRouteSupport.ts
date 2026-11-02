import type { FastifyBaseLogger, FastifyReply } from 'fastify';
import type { PrismaClient } from '../../../../generated/prisma/client.js';
import { enqueueOrgNotificationSafe } from '../../notifications/services/orgNotificationService.js';

export async function requireExistingAdminUserIdOr404(
  prisma: PrismaClient,
  userId: string,
  reply: FastifyReply
): Promise<string | undefined> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!user) {
    void reply.status(404).send({ error: 'User not found.' });
    return undefined;
  }
  return user.id;
}

export async function requireLocalPasswordUserIdOrRespond(
  prisma: PrismaClient,
  userId: string,
  reply: FastifyReply,
  ssoIneligibleMessage: string
): Promise<string | undefined> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, passwordHash: true },
  });
  if (!user) {
    void reply.status(404).send({ error: 'User not found.' });
    return undefined;
  }
  if (user.passwordHash == null) {
    void reply.status(400).send({ error: ssoIneligibleMessage });
    return undefined;
  }
  return user.id;
}

export function addTeamMembershipCatalogRow(
  r: {
    userId: string;
    team: { id: string; name: string; department: { id: string; name: string } } | null;
  },
  teamsByUser: Map<string, Array<{ id: string; name: string; departmentName: string }>>,
  departmentsByUser: Map<string, Array<{ id: string; name: string }>>
): void {
  const team = r.team;
  if (!team?.department) return;
  const list = teamsByUser.get(r.userId) ?? [];
  if (!list.some((t) => t.id === team.id)) {
    list.push({ id: team.id, name: team.name, departmentName: team.department.name });
  }
  teamsByUser.set(r.userId, list);
  const deptList = departmentsByUser.get(r.userId) ?? [];
  if (!deptList.some((d) => d.id === team.department.id)) {
    deptList.push({ id: team.department.id, name: team.department.name });
  }
  departmentsByUser.set(r.userId, deptList);
}

export function enqueueAdminRoleChangeNotification(
  log: FastifyBaseLogger,
  args: { targetUserId: string; actorUserId: string; granted: boolean }
): void {
  enqueueOrgNotificationSafe(log, {
    eventType: args.granted ? 'admin-granted' : 'admin-revoked',
    targetUserIds: [args.targetUserId],
    actorUserId: args.actorUserId,
    payload: {
      userId: args.targetUserId,
      scopeType: 'platform',
      scopeId: null,
      scopeName: 'Platform',
    },
  });
}
