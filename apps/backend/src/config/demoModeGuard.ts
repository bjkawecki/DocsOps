import type { FastifyReply, FastifyRequest } from 'fastify';
import { isDemoMode } from './runtimeMode.js';

/** Thrown when a mutating operation is forbidden in DEMO_MODE. */
export class DemoModeForbiddenError extends Error {
  constructor(message = 'This action is disabled in demo mode') {
    super(message);
    this.name = 'DemoModeForbiddenError';
  }
}

/** Throws when DEMO_MODE is active – use for mutating admin/ops endpoints. */
export function assertDemoMutationsAllowed(): void {
  if (isDemoMode()) {
    throw new DemoModeForbiddenError();
  }
}

/**
 * Fastify preHandler: blocks mutating admin ops when DEMO_MODE is on (403).
 */
export async function requireNotDemoMutatingPreHandler(
  _request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (isDemoMode()) {
    await reply.status(403).send({ error: 'This action is disabled in demo mode' });
  }
}
