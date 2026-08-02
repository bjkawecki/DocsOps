import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { treeifyError } from 'zod';
import { demoLoginBodySchema, loginBodySchema } from '../schemas/auth.js';
import { verifyPassword } from '../services/password.js';
import { createSession, deleteSession } from '../services/session.js';
import { demoLogin, DemoLoginUserNotFoundError } from '../services/demoLogin.js';
import { requireAuthPreHandler, SESSION_COOKIE_NAME } from '../middleware.js';
import { sessionCookieClearOptions, sessionCookieSetOptions } from '../sessionCookieOptions.js';
import { DemoModeForbiddenError } from '../../../config/demoModeGuard.js';

const authRoutes: FastifyPluginAsync = (app: FastifyInstance) => {
  /** POST /api/v1/auth/login – Body: { email, password }; bei Erfolg Set-Cookie, 204. */
  app.post(
    '/auth/login',
    {
      config: {
        rateLimit: {
          max: 20,
          timeWindow: '1 minute',
        },
      },
    },
    async (request, reply) => {
      const parseResult = loginBodySchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'Invalid input',
          details: treeifyError(parseResult.error),
        });
      }
      const { email, password } = parseResult.data;

      const user = await request.server.prisma.user.findUnique({
        where: { email },
      });
      if (!user || user.deletedAt || !user.passwordHash) {
        return reply.status(401).send({ error: 'Anmeldung fehlgeschlagen' });
      }

      const valid = await verifyPassword(user.passwordHash, password);
      if (!valid) {
        return reply.status(401).send({ error: 'Anmeldung fehlgeschlagen' });
      }

      const { id, expiresAt } = await createSession(request.server.prisma, user.id);
      const maxAgeSeconds = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
      return reply
        .setCookie(SESSION_COOKIE_NAME, id, sessionCookieSetOptions(maxAgeSeconds))
        .status(204)
        .send();
    }
  );

  /** POST /api/v1/auth/demo-login – Body: { role }; DEMO_MODE only; Set-Cookie, 204. */
  app.post(
    '/auth/demo-login',
    {
      config: {
        rateLimit: {
          max: 30,
          timeWindow: '1 minute',
        },
      },
    },
    async (request, reply) => {
      const parseResult = demoLoginBodySchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'Invalid input',
          details: treeifyError(parseResult.error),
        });
      }
      try {
        const { id, expiresAt } = await demoLogin(request.server.prisma, parseResult.data.role);
        const maxAgeSeconds = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
        return reply
          .setCookie(SESSION_COOKIE_NAME, id, sessionCookieSetOptions(maxAgeSeconds))
          .status(204)
          .send();
      } catch (err) {
        if (err instanceof DemoModeForbiddenError) {
          return reply.status(403).send({ error: err.message });
        }
        if (err instanceof DemoLoginUserNotFoundError) {
          return reply.status(401).send({ error: err.message });
        }
        throw err;
      }
    }
  );
  /** POST /api/v1/auth/logout – Session löschen, Cookie entfernen, 204. */
  app.post('/auth/logout', async (request, reply) => {
    const sessionId = request.cookies[SESSION_COOKIE_NAME];
    if (sessionId && typeof sessionId === 'string') {
      await deleteSession(request.server.prisma, sessionId);
    }
    return reply.clearCookie(SESSION_COOKIE_NAME, sessionCookieClearOptions()).status(204).send();
  });

  /** GET /api/v1/auth/me – aktueller User (geschützt). */
  app.get('/auth/me', { preHandler: requireAuthPreHandler }, async (request, reply) => {
    const user = request.user!;
    return reply.send({
      id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    });
  });
  return Promise.resolve();
};

export { authRoutes };
