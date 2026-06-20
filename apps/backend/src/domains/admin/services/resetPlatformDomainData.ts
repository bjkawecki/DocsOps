import type { PrismaClient } from '../../../../generated/prisma/client.js';
import type { StorageService } from '../../../infrastructure/storage/index.js';
import { assertMaintenanceAvailable } from '../../../infrastructure/maintenance/maintenanceModeService.js';
import { assertDevDestructiveDebugOperationAllowed } from './devDebugGuard.js';
import {
  clearPlatformDomainDataInTransaction,
  deleteNonAdminUsersInTransaction,
} from './platformMigration/platformDomainDataCleanup.js';

const DOMAIN_OBJECT_PREFIXES = ['attachments/', 'platform-exports/', 'platform-imports/'] as const;

async function deleteDomainMinioObjects(storage: StorageService): Promise<void> {
  for (const prefix of DOMAIN_OBJECT_PREFIXES) {
    const keys = await storage.listObjectKeys(prefix);
    for (const key of keys) {
      await storage.deleteObject(key).catch(() => undefined);
    }
  }
}

export async function resetPlatformDomainData(
  prisma: PrismaClient,
  storage: StorageService | null
): Promise<{ deletedNonAdminUsers: number }> {
  assertDevDestructiveDebugOperationAllowed();
  await assertMaintenanceAvailable(prisma);

  const deletedNonAdminUsers = await prisma.$transaction(async (tx) => {
    await clearPlatformDomainDataInTransaction(tx);
    return deleteNonAdminUsersInTransaction(tx);
  });

  if (storage) {
    await deleteDomainMinioObjects(storage);
  }

  return { deletedNonAdminUsers };
}
