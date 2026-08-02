import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import {
  requireAuthPreHandler,
  requireAdminPreHandler,
  getEffectiveUserId,
  type RequestWithUser,
} from '../../auth/middleware.js';
import {
  adminSystemCheckUpdatesResponseSchema,
  adminSystemMailTestBodySchema,
  adminSystemMailTestResponseSchema,
  adminSystemSettingsSchema,
  adminSystemUpdateStatusSchema,
  patchAdminSystemSettingsBodySchema,
} from '../schemas/systemUpdate.js';
import {
  DemoModeSmtpForbiddenError,
  getSystemSettings,
  sendSmtpTestEmail,
  SmtpSettingsValidationError,
  updateSystemSettings,
} from '../services/adminSystemSettingsService.js';
import {
  checkAdminSystemUpdatesAndNotify,
  getAdminSystemUpdateStatus,
  resetAdminSystemUpdateCacheForTests,
} from '../services/adminSystemUpdateService.js';

function settingsToResponse(settings: Awaited<ReturnType<typeof getSystemSettings>>) {
  return adminSystemSettingsSchema.parse({
    updateCheckEnabled: settings.updateCheckEnabled,
    smtpEnabled: settings.smtpEnabled,
    smtpHost: settings.smtpHost,
    smtpPort: settings.smtpPort,
    smtpEncryption: settings.smtpEncryption,
    smtpUsername: settings.smtpUsername,
    smtpPasswordConfigured: settings.smtpPasswordConfigured,
    smtpFromAddress: settings.smtpFromAddress,
    smtpFromName: settings.smtpFromName,
    updatedAt: settings.updatedAt.toISOString(),
  });
}

const adminSystemUpdateRoutes: FastifyPluginAsync = (app: FastifyInstance) => {
  const preAdmin = [requireAuthPreHandler, requireAdminPreHandler];

  app.get('/admin/system/update-status', { preHandler: preAdmin }, async (request, reply) => {
    const status = await getAdminSystemUpdateStatus(request.server.prisma);
    return reply.send(adminSystemUpdateStatusSchema.parse(status));
  });

  app.post('/admin/system/check-updates', { preHandler: preAdmin }, async (request, reply) => {
    const result = await checkAdminSystemUpdatesAndNotify(request.server.prisma);
    return reply.send(adminSystemCheckUpdatesResponseSchema.parse(result));
  });

  app.get('/admin/system/settings', { preHandler: preAdmin }, async (request, reply) => {
    const settings = await getSystemSettings(request.server.prisma);
    return reply.send(settingsToResponse(settings));
  });

  app.patch('/admin/system/settings', { preHandler: preAdmin }, async (request, reply) => {
    const body = patchAdminSystemSettingsBodySchema.parse(request.body);
    try {
      const settings = await updateSystemSettings(request.server.prisma, body);
      resetAdminSystemUpdateCacheForTests();
      return reply.send(settingsToResponse(settings));
    } catch (err) {
      if (err instanceof DemoModeSmtpForbiddenError) {
        return reply.status(403).send({ error: err.message });
      }
      if (err instanceof SmtpSettingsValidationError) {
        return reply.status(400).send({ error: err.message });
      }
      throw err;
    }
  });

  app.post('/admin/system/mail/test', { preHandler: preAdmin }, async (request, reply) => {
    const body = adminSystemMailTestBodySchema.parse(request.body ?? {});
    const prisma = request.server.prisma;
    const userId = getEffectiveUserId(request as RequestWithUser);

    let to = body.to?.trim();
    if (!to) {
      const admin = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });
      to = admin?.email?.trim() || undefined;
    }
    if (!to) {
      return reply
        .status(400)
        .send({ error: 'No recipient email; pass "to" or set your account email' });
    }

    try {
      await sendSmtpTestEmail(prisma, to);
      return reply.send(adminSystemMailTestResponseSchema.parse({ ok: true }));
    } catch (err) {
      if (err instanceof DemoModeSmtpForbiddenError) {
        return reply.status(403).send({ error: err.message });
      }
      if (err instanceof SmtpSettingsValidationError) {
        return reply.status(400).send({ error: err.message });
      }
      const message = err instanceof Error ? err.message : 'SMTP send failed';
      request.log.warn({ err }, 'SMTP test email failed');
      return reply.status(502).send({ error: message });
    }
  });

  return Promise.resolve();
};

export default adminSystemUpdateRoutes;
