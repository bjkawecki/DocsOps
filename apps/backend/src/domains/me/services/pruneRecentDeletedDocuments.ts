import type { PrismaClient } from '../../../../generated/prisma/client.js';
import type { UserPreferences } from '../routes/me/route-types.js';

type RecentByScope = NonNullable<UserPreferences['recentItemsByScope']>;

/**
 * Drop document recent-items whose docs are soft-deleted (or missing).
 * Process/project entries are left unchanged.
 */
export async function pruneDeletedDocumentsFromRecentItemsByScope(
  prisma: PrismaClient,
  recentItemsByScope: UserPreferences['recentItemsByScope']
): Promise<{ pruned: UserPreferences['recentItemsByScope']; changed: boolean }> {
  if (recentItemsByScope == null) {
    return { pruned: undefined, changed: false };
  }

  const documentIds = new Set<string>();
  for (const list of Object.values(recentItemsByScope)) {
    if (!Array.isArray(list)) continue;
    for (const item of list) {
      if (item?.type === 'document' && typeof item.id === 'string' && item.id !== '') {
        documentIds.add(item.id);
      }
    }
  }

  if (documentIds.size === 0) {
    return { pruned: recentItemsByScope, changed: false };
  }

  const activeDocs = await prisma.document.findMany({
    where: { id: { in: [...documentIds] }, deletedAt: null },
    select: { id: true },
  });
  const activeIds = new Set(activeDocs.map((d) => d.id));

  let changed = false;
  const pruned: RecentByScope = {};
  for (const [scopeKey, list] of Object.entries(recentItemsByScope)) {
    if (!Array.isArray(list)) {
      pruned[scopeKey] = [];
      changed = true;
      continue;
    }
    const next = list.filter(
      (item) => item.type !== 'document' || (item.id != null && activeIds.has(item.id))
    );
    if (next.length !== list.length) changed = true;
    pruned[scopeKey] = next;
  }

  return { pruned, changed };
}

/**
 * Load preferences, prune trash docs from recentItemsByScope, persist when changed.
 */
export async function loadPreferencesPruningDeletedRecentDocuments(
  prisma: PrismaClient,
  userId: string,
  preferences: unknown,
  parsePreferences: (raw: unknown) => UserPreferences
): Promise<UserPreferences> {
  const prefs = parsePreferences(preferences);
  const { pruned, changed } = await pruneDeletedDocumentsFromRecentItemsByScope(
    prisma,
    prefs.recentItemsByScope
  );
  if (!changed) return prefs;

  const next: UserPreferences = {
    ...prefs,
    ...(pruned !== undefined ? { recentItemsByScope: pruned } : { recentItemsByScope: {} }),
  };
  await prisma.user.update({
    where: { id: userId },
    data: { preferences: next },
  });
  return next;
}
