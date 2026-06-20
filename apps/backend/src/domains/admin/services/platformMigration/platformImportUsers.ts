import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Prisma, PrismaClient } from '../../../../../generated/prisma/client.js';

export type ExportUserRecord = {
  exportId: string;
  name: string;
  email: string | null;
  externalId: string | null;
  isAdmin: boolean;
  deletedAt: string | null;
  preferences: Prisma.InputJsonValue | null;
  passwordHash: string | null;
};

export function normalizeImportUserEmail(email: string | null | undefined): string | null {
  const trimmed = email?.trim();
  return trimmed ? trimmed : null;
}

export async function readExportUsers(bundleDir: string): Promise<ExportUserRecord[]> {
  const raw = await readFile(join(bundleDir, 'users.json'), 'utf8');
  return JSON.parse(raw) as ExportUserRecord[];
}

export async function findExistingEmailsForExportUsers(
  prisma: PrismaClient,
  exportUsers: ExportUserRecord[]
): Promise<string[]> {
  const emails = exportUsers
    .map((user) => normalizeImportUserEmail(user.email))
    .filter((email): email is string => email != null);
  if (emails.length === 0) return [];

  const existing = await prisma.user.findMany({
    where: { email: { in: emails } },
    select: { email: true },
  });
  return existing.map((user) => user.email).filter((email): email is string => email != null);
}

export async function resolveOrCreateImportedUser(
  prisma: PrismaClient,
  exportUser: ExportUserRecord,
  transferPasswordHashes: boolean
): Promise<string> {
  const email = normalizeImportUserEmail(exportUser.email);
  const deletedAt = exportUser.deletedAt ? new Date(exportUser.deletedAt) : null;

  if (email) {
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true, isAdmin: true, externalId: true },
    });
    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: exportUser.name,
          isAdmin: existing.isAdmin || exportUser.isAdmin,
          deletedAt,
          preferences: exportUser.preferences ?? undefined,
          externalId: exportUser.externalId ?? existing.externalId,
          ...(transferPasswordHashes && exportUser.passwordHash
            ? { passwordHash: exportUser.passwordHash }
            : {}),
        },
      });
      return existing.id;
    }
  }

  const created = await prisma.user.create({
    data: {
      name: exportUser.name,
      email,
      externalId: exportUser.externalId,
      isAdmin: exportUser.isAdmin,
      deletedAt,
      preferences: exportUser.preferences ?? undefined,
      passwordHash: transferPasswordHashes ? exportUser.passwordHash : null,
    },
  });
  return created.id;
}
