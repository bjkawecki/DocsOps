import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import type { Readable } from 'node:stream';
import {
  requireAuthPreHandler,
  getEffectiveUserId,
  type RequestWithUser,
} from '../../auth/middleware.js';
import { canViewScope } from '../permissions/scopeVisibility.js';
import { canManageCompanyPdfBranding } from '../permissions/assignmentPermissions.js';
import {
  companyIdParamSchema,
  updateCompanyPdfBrandingBodySchema,
} from '../schemas/organisation.js';
import {
  CompanyPdfBrandingNotFoundError,
  CompanyPdfLogoInvalidError,
  deleteCompanyPdfLogo,
  getCompanyPdfBrandingRow,
  toCompanyPdfBrandingPublic,
  updateCompanyPdfBranding,
  uploadCompanyPdfLogo,
} from '../services/companyPdfBrandingService.js';
import { PDF_LOGO_MAX_BYTES } from '../../../infrastructure/pdf/pdfBrandingTheme.js';

async function readableToBuffer(body: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of body) {
    if (Buffer.isBuffer(chunk)) chunks.push(chunk);
    else if (typeof chunk === 'string') chunks.push(Buffer.from(chunk));
    else chunks.push(Buffer.from(chunk as Uint8Array));
  }
  return Buffer.concat(chunks);
}

async function requirePdfBrandingManage(
  request: RequestWithUser,
  reply: { status: (code: number) => { send: (body: unknown) => unknown } },
  companyId: string
): Promise<boolean> {
  const userId = getEffectiveUserId(request);
  const allowed = await canManageCompanyPdfBranding(request.server.prisma, userId, companyId);
  if (!allowed) {
    await reply.status(403).send({ error: 'Permission denied to manage PDF branding' });
    return false;
  }
  return true;
}

const companyPdfBrandingRoutes: FastifyPluginAsync = (app: FastifyInstance) => {
  app.addContentTypeParser('application/octet-stream', { parseAs: 'buffer' }, (_req, body, done) =>
    done(null, body as Buffer)
  );
  app.addContentTypeParser(/^image\/(png|jpeg|jpg)/, { parseAs: 'buffer' }, (_req, body, done) =>
    done(null, body as Buffer)
  );

  app.get(
    '/companies/:companyId/pdf-branding',
    { preHandler: requireAuthPreHandler },
    async (request, reply) => {
      const prisma = request.server.prisma;
      const userId = getEffectiveUserId(request as RequestWithUser);
      const { companyId } = companyIdParamSchema.parse(request.params);
      const allowed = await canViewScope(prisma, userId, { type: 'company', companyId });
      if (!allowed) {
        return reply.status(403).send({ error: 'Permission denied to view this company' });
      }
      const row = await getCompanyPdfBrandingRow(prisma, companyId);
      if (!row) return reply.status(404).send({ error: 'Company not found' });
      return reply.send(toCompanyPdfBrandingPublic(row));
    }
  );

  app.patch(
    '/companies/:companyId/pdf-branding',
    { preHandler: requireAuthPreHandler },
    async (request, reply) => {
      const { companyId } = companyIdParamSchema.parse(request.params);
      if (!(await requirePdfBrandingManage(request as RequestWithUser, reply, companyId))) return;
      const body = updateCompanyPdfBrandingBodySchema.parse(request.body);
      try {
        const result = await updateCompanyPdfBranding(
          request.server.prisma,
          request.server.storage ?? null,
          companyId,
          body
        );
        return reply.send(result);
      } catch (err) {
        if (err instanceof CompanyPdfBrandingNotFoundError) {
          return reply.status(404).send({ error: err.message });
        }
        throw err;
      }
    }
  );

  app.post<{
    Params: { companyId: string };
    Body: Buffer;
  }>(
    '/companies/:companyId/pdf-logo',
    {
      preHandler: requireAuthPreHandler,
      bodyLimit: PDF_LOGO_MAX_BYTES,
    },
    async (request, reply) => {
      const { companyId } = companyIdParamSchema.parse(request.params);
      if (!(await requirePdfBrandingManage(request as RequestWithUser, reply, companyId))) return;
      const storage = request.server.storage;
      if (!storage) return reply.status(503).send({ error: 'Storage not available' });
      const body = request.body;
      if (!Buffer.isBuffer(body)) {
        return reply.status(400).send({ error: 'Binary body required' });
      }
      const contentType = (request.headers['content-type'] as string) ?? 'application/octet-stream';
      try {
        const result = await uploadCompanyPdfLogo(
          request.server.prisma,
          storage,
          companyId,
          body,
          contentType
        );
        return reply.status(201).send(result);
      } catch (err) {
        if (err instanceof CompanyPdfBrandingNotFoundError) {
          return reply.status(404).send({ error: err.message });
        }
        if (err instanceof CompanyPdfLogoInvalidError) {
          return reply.status(400).send({ error: err.message });
        }
        throw err;
      }
    }
  );

  app.delete(
    '/companies/:companyId/pdf-logo',
    { preHandler: requireAuthPreHandler },
    async (request, reply) => {
      const { companyId } = companyIdParamSchema.parse(request.params);
      if (!(await requirePdfBrandingManage(request as RequestWithUser, reply, companyId))) return;
      try {
        const result = await deleteCompanyPdfLogo(
          request.server.prisma,
          request.server.storage ?? null,
          companyId
        );
        return reply.send(result);
      } catch (err) {
        if (err instanceof CompanyPdfBrandingNotFoundError) {
          return reply.status(404).send({ error: err.message });
        }
        throw err;
      }
    }
  );

  app.get(
    '/companies/:companyId/pdf-logo',
    { preHandler: requireAuthPreHandler },
    async (request, reply) => {
      const prisma = request.server.prisma;
      const userId = getEffectiveUserId(request as RequestWithUser);
      const { companyId } = companyIdParamSchema.parse(request.params);
      const allowed = await canViewScope(prisma, userId, { type: 'company', companyId });
      if (!allowed) {
        return reply.status(403).send({ error: 'Permission denied to view this company' });
      }
      const row = await getCompanyPdfBrandingRow(prisma, companyId);
      if (!row?.pdfLogoObjectKey) {
        return reply.status(404).send({ error: 'PDF logo not found' });
      }
      const storage = request.server.storage;
      if (!storage) return reply.status(503).send({ error: 'Storage not available' });
      const object = await storage.getObject(row.pdfLogoObjectKey);
      if (!object) return reply.status(404).send({ error: 'PDF logo object missing' });
      const buffer = await readableToBuffer(object.Body);
      return reply
        .header('Content-Type', row.pdfLogoContentType ?? object.ContentType ?? 'image/png')
        .header('Cache-Control', 'private, max-age=300')
        .send(buffer);
    }
  );

  return Promise.resolve();
};

export { companyPdfBrandingRoutes };
