import type { PrismaClient } from '../../../../generated/prisma/client.js';
import { isDemoMode } from '../../../config/runtimeMode.js';
import { DemoModeForbiddenError } from '../../../config/demoModeGuard.js';
import { demoSeedEmailForRole, type DemoLoginRole } from '../schemas/demoLogin.js';
import { createSession } from './session.js';

export class DemoLoginUserNotFoundError extends Error {
  constructor(role: DemoLoginRole) {
    super(`Demo seed user for role "${role}" was not found`);
    this.name = 'DemoLoginUserNotFoundError';
  }
}

/**
 * Creates a session for the seed account matching `role`. Only when DEMO_MODE is on.
 * Admin uses ADMIN_EMAIL when set (same user as create-admin on boot).
 */
export async function demoLogin(
  prisma: PrismaClient,
  role: DemoLoginRole
): Promise<{ id: string; expiresAt: Date }> {
  if (!isDemoMode()) {
    throw new DemoModeForbiddenError('Demo login is only available in demo mode');
  }
  const email = demoSeedEmailForRole(role);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.deletedAt || !user.passwordHash) {
    throw new DemoLoginUserNotFoundError(role);
  }
  return createSession(prisma, user.id);
}
