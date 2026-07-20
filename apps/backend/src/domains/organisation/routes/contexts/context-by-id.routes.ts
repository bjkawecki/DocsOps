import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  requireAuthPreHandler,
  getEffectiveUserId,
  type RequestWithUser,
} from '../../../auth/middleware.js';
import { gateReadContextWithWriteHint } from './context-entity-route-helpers.js';

const contextIdParamSchema = z.object({ contextId: z.cuid() });

/**
 * GET /contexts/:contextId – unified payload for SPA workspace (process | project | subcontext).
 * Entity mutation APIs remain /processes/:processId and /projects/:projectId.
 */
function registerContextByIdRoutes(app: FastifyInstance): void {
  app.get('/contexts/:contextId', { preHandler: requireAuthPreHandler }, async (request, reply) => {
    const prisma = request.server.prisma;
    const { contextId } = contextIdParamSchema.parse(request.params);
    const userId = getEffectiveUserId(request as RequestWithUser);

    const context = await prisma.context.findUnique({
      where: { id: contextId },
      include: {
        process: { include: { owner: true } },
        project: {
          include: {
            owner: true,
            subcontexts: {
              select: { id: true, name: true, contextId: true },
              orderBy: { name: 'asc' },
            },
          },
        },
        subcontext: {
          include: {
            project: { include: { owner: true, context: true } },
          },
        },
      },
    });

    if (!context) {
      return reply.status(404).send({ error: 'Context not found' });
    }

    const writeAllowed = await gateReadContextWithWriteHint(prisma, userId, contextId, reply);
    if (writeAllowed === null) return;

    if (context.process) {
      const p = context.process;
      return reply.send({
        id: contextId,
        contextType: 'process' as const,
        name: p.name,
        entityId: p.id,
        ownerId: p.ownerId,
        owner: p.owner,
        canWriteContext: writeAllowed,
        deletedAt: p.deletedAt,
        archivedAt: p.archivedAt,
      });
    }

    if (context.project) {
      const p = context.project;
      return reply.send({
        id: contextId,
        contextType: 'project' as const,
        name: p.name,
        entityId: p.id,
        ownerId: p.ownerId,
        owner: p.owner,
        canWriteContext: writeAllowed,
        deletedAt: p.deletedAt,
        archivedAt: p.archivedAt,
        subcontexts: p.subcontexts,
      });
    }

    if (context.subcontext) {
      const s = context.subcontext;
      const project = s.project;
      return reply.send({
        id: contextId,
        contextType: 'subcontext' as const,
        name: s.name,
        entityId: s.id,
        ownerId: project.ownerId,
        owner: project.owner,
        canWriteContext: writeAllowed,
        parentProject: {
          id: project.id,
          name: project.name,
          contextId: project.contextId,
        },
      });
    }

    return reply.status(404).send({ error: 'Context has no process, project, or subcontext' });
  });
}

export { registerContextByIdRoutes };
