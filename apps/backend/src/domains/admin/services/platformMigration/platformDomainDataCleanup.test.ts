import { describe, expect, it } from 'vitest';
import { prisma } from '../../../../db.js';
import {
  capturePreImportUserSnapshots,
  rollbackFailedPlatformImport,
} from './platformDomainDataCleanup.js';

describe('rollbackFailedPlatformImport', () => {
  it('removes imported domain data and restores pre-existing users', async () => {
    const admin = await prisma.user.findFirst({
      where: { isAdmin: true, deletedAt: null },
      select: { id: true, name: true },
    });
    expect(admin).not.toBeNull();

    const preImportUsers = await capturePreImportUserSnapshots(prisma);
    await prisma.company.create({ data: { name: 'Rollback Test Co' } });
    const importedUser = await prisma.user.create({
      data: { name: 'Imported User', email: `rollback-import-${Date.now()}@example.test` },
    });

    await rollbackFailedPlatformImport(prisma, null, preImportUsers);

    const companyCount = await prisma.company.count();
    const importedStillExists = await prisma.user.findUnique({ where: { id: importedUser.id } });
    const adminAfter = await prisma.user.findUnique({
      where: { id: admin!.id },
      select: { name: true },
    });

    expect(companyCount).toBe(0);
    expect(importedStillExists).toBeNull();
    expect(adminAfter?.name).toBe(admin!.name);
  });
});
