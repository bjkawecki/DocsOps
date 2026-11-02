import type { PrismaClient } from '../../../../../generated/prisma/client.js';

export type DocumentContributorRow = { id: string; name: string };

/** Stable unique list preserving first-seen order. */
export function uniqueUserIds(ids: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

export function mergeContributorUserId(existing: string[], userId: string): string[] {
  return uniqueUserIds([...existing, userId]);
}

/**
 * Resolve contributor user IDs to id/name rows (existing users only, name order).
 */
export async function resolveDocumentContributors(
  prisma: PrismaClient,
  userIds: string[]
): Promise<DocumentContributorRow[]> {
  const ids = uniqueUserIds(userIds);
  if (ids.length === 0) return [];
  const users = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true },
  });
  const byId = new Map(users.map((u) => [u.id, u.name]));
  const rows: DocumentContributorRow[] = [];
  for (const id of ids) {
    const name = byId.get(id);
    if (name == null) continue;
    rows.push({ id, name });
  }
  return rows.sort((a, b) => a.name.localeCompare(b.name));
}
