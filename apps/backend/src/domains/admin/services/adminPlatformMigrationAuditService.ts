import type { Prisma, PrismaClient } from '../../../../generated/prisma/client.js';

export async function writeAdminPlatformMigrationAudit(
  prisma: PrismaClient,
  args: {
    actorUserId: string;
    action: string;
    status: string;
    platformExportRunId?: string;
    platformImportRunId?: string;
    details?: Record<string, unknown>;
  }
): Promise<void> {
  await prisma.adminPlatformMigrationAudit.create({
    data: {
      actorUserId: args.actorUserId,
      action: args.action,
      status: args.status,
      platformExportRunId: args.platformExportRunId ?? null,
      platformImportRunId: args.platformImportRunId ?? null,
      details: (args.details ?? {}) as Prisma.InputJsonValue,
    },
  });
}
