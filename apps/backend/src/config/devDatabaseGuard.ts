/**
 * Safety gate for destructive dev-only operations (platform reset, re-seed).
 * Only databases listed in DEV_DESTRUCTIVE_DB_NAMES (default: docsops) are allowed.
 * Tests may set ALLOW_DESTRUCTIVE_DB_ANY=1 to skip the name check.
 */
export function parseDatabaseNameFromUrl(databaseUrl: string | undefined): string | null {
  if (!databaseUrl?.trim()) return null;
  try {
    const normalized = databaseUrl.replace(/^postgres:/, 'postgresql:');
    const url = new URL(normalized);
    const segment = url.pathname.replace(/^\//, '').split('/')[0];
    const name = segment?.split('?')[0]?.trim();
    return name || null;
  } catch {
    const match = databaseUrl.match(/\/([^/?]+)(?:\?|$)/);
    return match?.[1]?.trim() ?? null;
  }
}

export function getAllowedDestructiveDatabaseNames(): string[] {
  const raw = process.env.DEV_DESTRUCTIVE_DB_NAMES ?? 'docsops';
  return raw
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

export function assertDestructiveDevDatabaseAllowed(): void {
  if (process.env.ALLOW_DESTRUCTIVE_DB_ANY === '1') return;

  const current = parseDatabaseNameFromUrl(process.env.DATABASE_URL);
  const allowed = getAllowedDestructiveDatabaseNames();
  if (!current || !allowed.includes(current)) {
    const allowedLabel = allowed.join(', ');
    throw new Error(
      `Destructive debug operations are only allowed on databases: ${allowedLabel}. Current DATABASE_URL database: ${current ?? 'unknown'}`
    );
  }
}
