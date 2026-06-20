import type { PrismaClient } from '../../../../generated/prisma/client.js';
import type { StorageService } from '../../../infrastructure/storage/index.js';
import { assertMaintenanceAvailable } from '../../../infrastructure/maintenance/maintenanceModeService.js';
import { assertDevDestructiveDebugOperationAllowed } from './devDebugGuard.js';

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
    await tx.document.updateMany({
      data: { currentPublishedVersionId: null, publishedAt: null },
    });
    await tx.document.deleteMany({});
    await tx.context.deleteMany({});
    await tx.owner.deleteMany({});
    await tx.teamMember.deleteMany({});
    await tx.teamLead.deleteMany({});
    await tx.departmentLead.deleteMany({});
    await tx.companyLead.deleteMany({});
    await tx.team.deleteMany({});
    await tx.department.deleteMany({});
    await tx.company.deleteMany({});

    const nonAdminUsers = await tx.user.findMany({
      where: { isAdmin: false },
      select: { id: true },
    });
    const nonAdminIds = nonAdminUsers.map((u) => u.id);
    if (nonAdminIds.length > 0) {
      await tx.session.deleteMany({ where: { userId: { in: nonAdminIds } } });
      await tx.user.deleteMany({ where: { id: { in: nonAdminIds } } });
    }
    return nonAdminIds.length;
  });

  if (storage) {
    await deleteDomainMinioObjects(storage);
  }

  return { deletedNonAdminUsers };
}
