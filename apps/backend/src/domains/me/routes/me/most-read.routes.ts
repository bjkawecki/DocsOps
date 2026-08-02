import type { FastifyInstance } from 'fastify';
import {
  requireAuthPreHandler,
  getEffectiveUserId,
  type RequestWithUser,
} from '../../../auth/middleware.js';
import { meMostReadQuerySchema } from '../../schemas/me.js';
import type { ScopeRef } from '../../../organisation/permissions/scopeResolution.js';
import { getMostReadDocuments } from '../../services/mostReadService.js';

function orgScopeRefFromMeOrgQuery(query: {
  scope: 'company' | 'department' | 'team';
  companyId?: string;
  departmentId?: string;
  teamId?: string;
}): ScopeRef {
  if (query.scope === 'company') return { type: 'company', companyId: query.companyId! };
  if (query.scope === 'department')
    return { type: 'department', departmentId: query.departmentId! };
  return { type: 'team', teamId: query.teamId! };
}

function registerMeMostReadRoutes(app: FastifyInstance): void {
  app.get('/me/most-read', { preHandler: requireAuthPreHandler }, async (request, reply) => {
    const prisma = request.server.prisma;
    const userId = getEffectiveUserId(request as RequestWithUser);
    const query = meMostReadQuerySchema.parse(request.query);

    if (query.scope === 'personal') {
      const result = await getMostReadDocuments(prisma, userId, { type: 'personal' });
      return reply.send(result);
    }

    const scopeRef = orgScopeRefFromMeOrgQuery(
      query as {
        scope: 'company' | 'department' | 'team';
        companyId?: string;
        departmentId?: string;
        teamId?: string;
      }
    );
    const result = await getMostReadDocuments(prisma, userId, scopeRef);
    return reply.send(result);
  });
}

export { registerMeMostReadRoutes };
