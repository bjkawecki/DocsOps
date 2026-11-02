const ONLINE_THRESHOLD_MS = 5 * 60_000;

type PresenceT = (key: string, options?: Record<string, unknown>) => string;

/**
 * Formats presence for scope people UI.
 * Pass `t` bound to the `common` namespace (keys under `scopePeople.presence.*`).
 */
export function formatPresence(
  isOnline: boolean,
  lastActiveAt: string | null,
  t: PresenceT
): string | null {
  if (isOnline) return t('scopePeople.presence.online');
  if (lastActiveAt == null) return null;

  const last = new Date(lastActiveAt);
  const diffMs = Date.now() - last.getTime();
  if (diffMs < 0) return t('scopePeople.presence.online');

  const diffMinutes = Math.floor(diffMs / 60_000);
  if (diffMinutes < 1) return t('scopePeople.presence.activeJustNow');
  if (diffMinutes < 60) {
    return t('scopePeople.presence.activeMinutesAgo', { count: diffMinutes });
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return t('scopePeople.presence.lastSeenHoursAgo', { count: diffHours });
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return t('scopePeople.presence.lastSeenDaysAgo', { count: diffDays });
  }

  return t('scopePeople.presence.lastSeenOn', {
    date: last.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
  });
}

/** Client-side online hint when API flag is stale (optional fallback). */
export function isLikelyOnline(lastActiveAt: string | null): boolean {
  if (lastActiveAt == null) return false;
  return Date.now() - new Date(lastActiveAt).getTime() <= ONLINE_THRESHOLD_MS;
}

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  const first = parts[0][0] ?? '';
  const last = parts[parts.length - 1][0] ?? '';
  return `${first}${last}`.toUpperCase();
}
