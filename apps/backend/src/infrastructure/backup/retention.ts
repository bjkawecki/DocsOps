import type { PrismaClient } from '../../../generated/prisma/client.js';
import type { StorageService } from '../storage/index.js';

export function getDefaultRetentionCount(): number {
  const raw = process.env.BACKUP_RETENTION_COUNT;
  if (raw == null || raw.trim() === '') return 7;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return 7;
  if (n > 365) return 365;
  return n;
}

export async function getEffectiveRetentionCount(prisma: PrismaClient): Promise<number> {
  const settings = await prisma.backupSettings.findUnique({ where: { id: 'default' } });
  if (settings?.retentionCount != null && settings.retentionCount > 0) {
    return settings.retentionCount;
  }
  return getDefaultRetentionCount();
}

export async function applyBackupRetention(
  prisma: PrismaClient,
  storage: StorageService | null,
  retentionCount: number
): Promise<number> {
  if (retentionCount <= 0) return 0;

  const succeeded = await prisma.backupRun.findMany({
    where: { status: 'succeeded' },
    orderBy: { createdAt: 'desc' },
    select: { id: true, localObjectKey: true },
  });

  const toDelete = succeeded.slice(retentionCount);
  let deleted = 0;
  for (const run of toDelete) {
    if (storage && run.localObjectKey) {
      await storage.deleteObject(run.localObjectKey).catch(() => undefined);
    }
    await prisma.backupRun.delete({ where: { id: run.id } });
    deleted += 1;
  }
  return deleted;
}
