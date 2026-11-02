import type { FastifyInstance } from 'fastify';
import {
  requireAuthPreHandler,
  getEffectiveUserId,
  type RequestWithUser,
} from '../../auth/middleware.js';
import { requireNotDemoMutatingPreHandler } from '../../../config/demoModeGuard.js';
import { documentIdParamSchema } from '../schemas/documents.js';
import {
  documentHealthCheckIntervalBodySchema,
  documentHealthCheckStillValidBodySchema,
} from '../schemas/healthCheck.js';
import { canRunHealthCheckForDocument } from '../../organisation/permissions/healthCheckPermissions.js';
import { canRead } from '../permissions/canRead.js';
import { isEligible } from '../services/healthCheck/healthCheckPolicy.js';
import {
  HealthCheckDocumentNotFoundError,
  clearOutcome,
  markNeedsArchive,
  markNeedsUpdate,
  markStillValid,
  updateDocumentInterval,
} from '../services/healthCheck/healthCheckService.js';
import {
  notifyHealthCheckAfterDocumentChange,
  notifyHealthCheckNeedsUpdate,
  notifyHealthCheckSafe,
  snapshotHealthCheckScopeCount,
} from '../services/healthCheck/healthCheckNotificationService.js';
import { serializeDocumentHealthCheckFields } from '../services/route-support/documentRouteSupport.js';

async function assertHealthCheckPermission(
  prisma: Parameters<typeof canRunHealthCheckForDocument>[0],
  userId: string,
  documentId: string,
  reply: { status: (code: number) => { send: (body: unknown) => unknown } }
): Promise<boolean> {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: { id: true },
  });
  if (!doc) {
    reply.status(404).send({ error: 'Document not found' });
    return false;
  }

  const allowed = await canRunHealthCheckForDocument(prisma, userId, documentId);
  if (!allowed) {
    const readable = await canRead(prisma, userId, documentId);
    if (!readable) {
      reply.status(404).send({ error: 'Document not found' });
      return false;
    }
    reply.status(403).send({ error: 'Permission denied' });
    return false;
  }
  return true;
}

async function assertHealthCheckActionAllowed(
  prisma: Parameters<typeof canRunHealthCheckForDocument>[0],
  userId: string,
  documentId: string,
  reply: { status: (code: number) => { send: (body: unknown) => unknown } }
): Promise<boolean> {
  if (!(await assertHealthCheckPermission(prisma, userId, documentId, reply))) {
    return false;
  }

  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: {
      publishedAt: true,
      archivedAt: true,
      deletedAt: true,
      contextId: true,
    },
  });
  if (!doc) {
    reply.status(404).send({ error: 'Document not found' });
    return false;
  }

  if (!isEligible(doc)) {
    reply.status(409).send({
      error: 'Document is not eligible for health check',
      code: 'HEALTH_CHECK_NOT_ELIGIBLE',
    });
    return false;
  }
  return true;
}

function registerDocumentFreshnessRoutes(app: FastifyInstance): void {
  const pre = [requireAuthPreHandler, requireNotDemoMutatingPreHandler] as const;

  app.post(
    '/documents/:documentId/freshness/still-valid',
    { preHandler: [...pre] },
    async (request, reply) => {
      const prisma = request.server.prisma;
      const userId = getEffectiveUserId(request as RequestWithUser);
      const { documentId } = documentIdParamSchema.parse(request.params);
      const body = documentHealthCheckStillValidBodySchema.parse(request.body ?? {});
      if (!(await assertHealthCheckActionAllowed(prisma, userId, documentId, reply))) return;

      try {
        const before = await snapshotHealthCheckScopeCount(prisma, documentId);
        await markStillValid(prisma, documentId, userId, new Date(), body.intervalDays);
        await notifyHealthCheckSafe(request.log, { documentId, userId }, async () => {
          await notifyHealthCheckAfterDocumentChange({
            prisma,
            documentId,
            beforeCount: before.count,
            actorUserId: userId,
          });
        });
        return reply.status(204).send();
      } catch (err) {
        if (err instanceof HealthCheckDocumentNotFoundError) {
          return reply.status(404).send({ error: 'Document not found' });
        }
        throw err;
      }
    }
  );

  app.post(
    '/documents/:documentId/freshness/needs-update',
    { preHandler: [...pre] },
    async (request, reply) => {
      const prisma = request.server.prisma;
      const userId = getEffectiveUserId(request as RequestWithUser);
      const { documentId } = documentIdParamSchema.parse(request.params);
      if (!(await assertHealthCheckActionAllowed(prisma, userId, documentId, reply))) return;

      try {
        const before = await snapshotHealthCheckScopeCount(prisma, documentId);
        await markNeedsUpdate(prisma, documentId, userId);
        await notifyHealthCheckSafe(request.log, { documentId, userId }, async () => {
          await notifyHealthCheckAfterDocumentChange({
            prisma,
            documentId,
            beforeCount: before.count,
            actorUserId: userId,
          });
          await notifyHealthCheckNeedsUpdate(prisma, documentId, userId);
        });
        return reply.status(204).send();
      } catch (err) {
        if (err instanceof HealthCheckDocumentNotFoundError) {
          return reply.status(404).send({ error: 'Document not found' });
        }
        throw err;
      }
    }
  );

  app.post(
    '/documents/:documentId/freshness/archive',
    { preHandler: [...pre] },
    async (request, reply) => {
      const prisma = request.server.prisma;
      const userId = getEffectiveUserId(request as RequestWithUser);
      const { documentId } = documentIdParamSchema.parse(request.params);
      if (!(await assertHealthCheckActionAllowed(prisma, userId, documentId, reply))) return;

      try {
        const before = await snapshotHealthCheckScopeCount(prisma, documentId);
        await markNeedsArchive(prisma, documentId, userId);
        await notifyHealthCheckSafe(request.log, { documentId, userId }, async () => {
          await notifyHealthCheckAfterDocumentChange({
            prisma,
            documentId,
            beforeCount: before.count,
            actorUserId: userId,
          });
        });
        return reply.status(204).send();
      } catch (err) {
        if (err instanceof HealthCheckDocumentNotFoundError) {
          return reply.status(404).send({ error: 'Document not found' });
        }
        throw err;
      }
    }
  );

  app.post(
    '/documents/:documentId/freshness/clear-outcome',
    { preHandler: [...pre] },
    async (request, reply) => {
      const prisma = request.server.prisma;
      const userId = getEffectiveUserId(request as RequestWithUser);
      const { documentId } = documentIdParamSchema.parse(request.params);
      if (!(await assertHealthCheckActionAllowed(prisma, userId, documentId, reply))) return;

      try {
        const before = await snapshotHealthCheckScopeCount(prisma, documentId);
        await clearOutcome(prisma, documentId, userId);
        await notifyHealthCheckSafe(request.log, { documentId, userId }, async () => {
          await notifyHealthCheckAfterDocumentChange({
            prisma,
            documentId,
            beforeCount: before.count,
            actorUserId: userId,
          });
        });
        return reply.status(204).send();
      } catch (err) {
        if (err instanceof HealthCheckDocumentNotFoundError) {
          return reply.status(404).send({ error: 'Document not found' });
        }
        throw err;
      }
    }
  );

  app.patch(
    '/documents/:documentId/freshness/interval',
    { preHandler: [...pre] },
    async (request, reply) => {
      const prisma = request.server.prisma;
      const userId = getEffectiveUserId(request as RequestWithUser);
      const { documentId } = documentIdParamSchema.parse(request.params);
      const body = documentHealthCheckIntervalBodySchema.parse(request.body);
      if (!(await assertHealthCheckPermission(prisma, userId, documentId, reply))) return;

      try {
        await updateDocumentInterval(prisma, documentId, body.intervalDays);
      } catch (err) {
        if (err instanceof HealthCheckDocumentNotFoundError) {
          return reply.status(404).send({ error: 'Document not found' });
        }
        throw err;
      }

      const updated = await prisma.document.findUnique({
        where: { id: documentId },
        select: {
          healthCheckIntervalDays: true,
          healthCheckNextAt: true,
          healthCheckNeedsUpdate: true,
          healthCheckNeedsArchive: true,
          healthCheckSnoozedUntil: true,
          healthCheckLastDecision: true,
          healthCheckLastDecisionAt: true,
          healthCheckLastDecisionBy: { select: { id: true, name: true } },
        },
      });
      if (!updated) {
        return reply.status(404).send({ error: 'Document not found' });
      }
      return reply.status(200).send(serializeDocumentHealthCheckFields(updated));
    }
  );
}

export { registerDocumentFreshnessRoutes };
