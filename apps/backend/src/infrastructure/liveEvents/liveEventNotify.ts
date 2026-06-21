import { Prisma } from '../../../generated/prisma/client.js';
import type { PrismaClient } from '../../../generated/prisma/client.js';
import { LIVE_EVENTS_CHANNEL } from './liveEventConfig.js';
import type { LiveNotifyEnvelope } from './liveEventTypes.js';

export async function notifyLiveEvent(
  prisma: PrismaClient,
  envelope: LiveNotifyEnvelope
): Promise<void> {
  const payload = JSON.stringify(envelope);
  await prisma.$executeRaw(Prisma.sql`SELECT pg_notify(${LIVE_EVENTS_CHANNEL}, ${payload})`);
}
