import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import {
  requireAuthPreHandler,
  requireAdminPreHandler,
  getEffectiveUserId,
  type RequestWithUser,
} from '../../auth/middleware.js';
import {
  adminBroadcastBodySchema,
  adminBroadcastListQuerySchema,
} from '../schemas/notifications.js';
import {
  listAdminBroadcastHistory,
  sendAdminBroadcast,
} from '../services/adminBroadcastNotificationService.js';

const adminNotificationsRoutes: FastifyPluginAsync = (app: FastifyInstance) => {
  const preAdmin = [requireAuthPreHandler, requireAdminPreHandler];

  app.post('/admin/notifications/broadcast', { preHandler: preAdmin }, async (request, reply) => {
    const body = adminBroadcastBodySchema.parse(request.body);
    const actorUserId = getEffectiveUserId(request as RequestWithUser);
    const result = await sendAdminBroadcast(request.server.prisma, {
      actorUserId,
      title: body.title,
      message: body.message,
      targetKind: body.targetKind,
      userIds: body.userIds,
    });
    return reply.status(201).send(result);
  });

  app.get('/admin/notifications/broadcasts', { preHandler: preAdmin }, async (request, reply) => {
    const query = adminBroadcastListQuerySchema.parse(request.query);
    const { items, total } = await listAdminBroadcastHistory(
      request.server.prisma,
      query.limit,
      query.offset
    );
    return reply.send({
      items: items.map((item) => ({
        id: item.id,
        actorUserId: item.actorUserId,
        title: item.title,
        message: item.message,
        targetKind: item.targetKind,
        deliveredCount: item.deliveredCount,
        createdAt: item.createdAt.toISOString(),
      })),
      total,
      limit: query.limit,
      offset: query.offset,
    });
  });

  return Promise.resolve();
};

export default adminNotificationsRoutes;
