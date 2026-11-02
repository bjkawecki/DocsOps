import type { PrismaClient } from '../../../../generated/prisma/client.js';
import { reseedPlatformFromCsv } from '../../../seed.js';
import { assertDevDestructiveDebugOperationAllowed } from './devDebugGuard.js';

export async function reseedPlatformDomainData(prisma: PrismaClient): Promise<{ seeded: true }> {
  assertDevDestructiveDebugOperationAllowed();
  return reseedPlatformFromCsv(prisma);
}
