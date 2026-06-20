import type { Prisma, PrismaClient } from '../../../../../generated/prisma/client.js';
import type { StorageService } from '../../../../infrastructure/storage/index.js';

export type PreImportUserSnapshot = {
  id: string;
  name: string;
  email: string | null;
  externalId: string | null;
  isAdmin: boolean;
  deletedAt: Date | null;
  preferences: Prisma.JsonValue | null;
  passwordHash: string | null;
};

const IMPORT_ROLLBACK_MINIO_PREFIXES = ['attachments/', 'exports/documents/'] as const;

export async function capturePreImportUserSnapshots(
  prisma: PrismaClient
): Promise<PreImportUserSnapshot[]> {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      externalId: true,
      isAdmin: true,
      deletedAt: true,
      preferences: true,
      passwordHash: true,
    },
  });
}

/** Deletes org, contexts, documents, and related rows (not users). */
export async function clearPlatformDomainDataInTransaction(
  tx: Prisma.TransactionClient
): Promise<void> {
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
}

async function deleteMinioPrefixes(
  storage: StorageService,
  prefixes: readonly string[]
): Promise<void> {
  for (const prefix of prefixes) {
    const keys = await storage.listObjectKeys(prefix);
    for (const key of keys) {
      await storage.deleteObject(key).catch(() => undefined);
    }
  }
}

export async function deleteNonAdminUsersInTransaction(
  tx: Prisma.TransactionClient
): Promise<number> {
  const nonAdminUsers = await tx.user.findMany({
    where: { isAdmin: false },
    select: { id: true },
  });
  const nonAdminIds = nonAdminUsers.map((u) => u.id);
  if (nonAdminIds.length === 0) return 0;

  await tx.session.deleteMany({ where: { userId: { in: nonAdminIds } } });
  await tx.user.deleteMany({ where: { id: { in: nonAdminIds } } });
  return nonAdminIds.length;
}

/**
 * Restores a failed platform import on an instance that was empty before import:
 * domain data cleared, import-created users removed, pre-existing users restored.
 */
export async function rollbackFailedPlatformImport(
  prisma: PrismaClient,
  storage: StorageService | null,
  preImportUsers: PreImportUserSnapshot[]
): Promise<void> {
  const preservedIds = preImportUsers.map((u) => u.id);

  await prisma.$transaction(async (tx) => {
    await clearPlatformDomainDataInTransaction(tx);

    const usersToDelete = await tx.user.findMany({
      where: { id: { notIn: preservedIds } },
      select: { id: true },
    });
    const deleteIds = usersToDelete.map((u) => u.id);
    if (deleteIds.length > 0) {
      await tx.session.deleteMany({ where: { userId: { in: deleteIds } } });
      await tx.user.deleteMany({ where: { id: { in: deleteIds } } });
    }

    for (const user of preImportUsers) {
      await tx.user.update({
        where: { id: user.id },
        data: {
          name: user.name,
          email: user.email,
          externalId: user.externalId,
          isAdmin: user.isAdmin,
          deletedAt: user.deletedAt,
          preferences: user.preferences ?? undefined,
          passwordHash: user.passwordHash,
        },
      });
    }
  });

  if (storage) {
    await deleteMinioPrefixes(storage, IMPORT_ROLLBACK_MINIO_PREFIXES);
  }
}
