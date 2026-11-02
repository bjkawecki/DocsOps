import type { FastifyInstance } from 'fastify';
import {
  requireAuthPreHandler,
  getEffectiveUserId,
  type RequestWithUser,
} from '../../../auth/middleware.js';
import { requireNotDemoMutatingPreHandler } from '../../../../config/demoModeGuard.js';
import {
  meHealthCheckQuerySchema,
  meHealthCheckScanBodySchema,
  meHealthCheckListResponseSchema,
  meHealthCheckScanResponseSchema,
} from '../../schemas/me.js';
import {
  HealthCheckForbiddenError,
  listHealthCheckActionNeeded,
  scanHealthCheckSubtree,
  toScopeRefFromFilter,
} from '../../services/healthCheckHubService.js';

function registerMeFreshnessRoutes(app: FastifyInstance): void {
  app.get('/me/freshness', { preHandler: requireAuthPreHandler }, async (request, reply) => {
    const userId = getEffectiveUserId(request as RequestWithUser);
    const query = meHealthCheckQuerySchema.parse(request.query);
    const scopeFilter =
      query.scope == null
        ? null
        : toScopeRefFromFilter({
            companyId: query.companyId,
            departmentId: query.departmentId,
            teamId: query.teamId,
          });

    try {
      const result = await listHealthCheckActionNeeded(request.server.prisma, userId, {
        reason: query.reason,
        outcome: query.outcome,
        scopeFilter,
        limit: query.limit,
        offset: query.offset,
      });
      return reply.send(meHealthCheckListResponseSchema.parse(result));
    } catch (err) {
      if (err instanceof HealthCheckForbiddenError) {
        return reply.status(403).send({ error: err.message });
      }
      throw err;
    }
  });

  app.post(
    '/me/freshness/scan',
    { preHandler: [requireAuthPreHandler, requireNotDemoMutatingPreHandler] },
    async (request, reply) => {
      const userId = getEffectiveUserId(request as RequestWithUser);
      const body = meHealthCheckScanBodySchema.parse(request.body ?? {});
      const scopeFilter = toScopeRefFromFilter(body);

      try {
        const result = await scanHealthCheckSubtree(request.server.prisma, userId, scopeFilter);
        return reply.send(meHealthCheckScanResponseSchema.parse(result));
      } catch (err) {
        if (err instanceof HealthCheckForbiddenError) {
          return reply.status(403).send({ error: err.message });
        }
        throw err;
      }
    }
  );
}

export { registerMeFreshnessRoutes };
