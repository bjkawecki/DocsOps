import type { FastifyInstance } from 'fastify';
import {
  requireAuthPreHandler,
  getEffectiveUserId,
  type RequestWithUser,
} from '../../auth/middleware.js';
import {
  listDocumentTypesQuerySchema,
  createCustomDocumentTypeBodySchema,
  updateCustomDocumentTypeBodySchema,
  customDocumentTypeIdParamSchema,
} from '../schemas/documentTemplates.js';
import {
  listDocumentTypes,
  listDocumentTemplates,
  getDocumentTemplatesManageAccess,
  createCustomDocumentType,
  updateCustomDocumentType,
  deleteCustomDocumentType,
  DocumentTemplateNotFoundError,
  DocumentTemplateForbiddenError,
  DocumentTemplateValidationError,
} from '../services/templates/documentTemplateService.js';

function mapTemplateError(
  err: unknown,
  reply: { status: (code: number) => { send: (body: unknown) => unknown } }
): boolean {
  if (err instanceof DocumentTemplateNotFoundError) {
    reply.status(404).send({ error: err.message });
    return true;
  }
  if (err instanceof DocumentTemplateForbiddenError) {
    reply.status(403).send({ error: err.message });
    return true;
  }
  if (err instanceof DocumentTemplateValidationError) {
    reply.status(400).send({ error: err.message });
    return true;
  }
  return false;
}

export function registerDocumentTemplateRoutes(app: FastifyInstance): void {
  app.get('/document-types', { preHandler: requireAuthPreHandler }, async (request, reply) => {
    const prisma = request.server.prisma;
    const query = listDocumentTypesQuerySchema.parse(request.query);
    const items = await listDocumentTypes(prisma, {
      contextId: query.contextId,
      oftenUsedIn: query.oftenUsedIn,
    });
    return reply.send({ items });
  });

  app.get('/document-templates', { preHandler: requireAuthPreHandler }, async (request, reply) => {
    const prisma = request.server.prisma;
    const query = listDocumentTypesQuerySchema.parse(request.query);
    const items = await listDocumentTemplates(prisma, {
      contextId: query.contextId,
      oftenUsedIn: query.oftenUsedIn,
    });
    return reply.send({ items });
  });

  app.get(
    '/document-templates/manage-access',
    { preHandler: requireAuthPreHandler },
    async (request, reply) => {
      const prisma = request.server.prisma;
      const userId = getEffectiveUserId(request as RequestWithUser);
      return reply.send(await getDocumentTemplatesManageAccess(prisma, userId));
    }
  );

  app.post('/document-types', { preHandler: requireAuthPreHandler }, async (request, reply) => {
    const prisma = request.server.prisma;
    const userId = getEffectiveUserId(request as RequestWithUser);
    const body = createCustomDocumentTypeBodySchema.parse(request.body);
    try {
      const created = await createCustomDocumentType(prisma, userId, body);
      return reply.status(201).send(created);
    } catch (err) {
      if (mapTemplateError(err, reply)) return;
      throw err;
    }
  });

  app.patch<{ Params: { typeId: string } }>(
    '/document-types/:typeId',
    { preHandler: requireAuthPreHandler },
    async (request, reply) => {
      const prisma = request.server.prisma;
      const userId = getEffectiveUserId(request as RequestWithUser);
      const { typeId } = customDocumentTypeIdParamSchema.parse(request.params);
      const body = updateCustomDocumentTypeBodySchema.parse(request.body);
      try {
        const updated = await updateCustomDocumentType(prisma, userId, typeId, body);
        return reply.send(updated);
      } catch (err) {
        if (mapTemplateError(err, reply)) return;
        throw err;
      }
    }
  );

  app.delete<{ Params: { typeId: string } }>(
    '/document-types/:typeId',
    { preHandler: requireAuthPreHandler },
    async (request, reply) => {
      const prisma = request.server.prisma;
      const userId = getEffectiveUserId(request as RequestWithUser);
      const { typeId } = customDocumentTypeIdParamSchema.parse(request.params);
      try {
        await deleteCustomDocumentType(prisma, userId, typeId);
        return reply.status(204).send();
      } catch (err) {
        if (mapTemplateError(err, reply)) return;
        throw err;
      }
    }
  );
}
