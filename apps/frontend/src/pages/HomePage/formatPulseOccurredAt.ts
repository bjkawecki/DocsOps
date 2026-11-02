type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

const MS_2H = 2 * 60 * 60 * 1000;
const MS_DAY = 24 * 60 * 60 * 1000;

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function formatTime(d: Date): string {
  return d.toLocaleString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Local calendar day key `YYYY-MM-DD` for grouping. */
export function pulseDayKey(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Day label for the left feed column: Today / Yesterday / short date. */
export function formatPulseDayLabel(
  iso: string,
  t: TranslateFn,
  nowMs: number = Date.now()
): string {
  const then = new Date(iso);
  const now = new Date(nowMs);
  const thenStart = startOfLocalDay(then).getTime();
  const nowStart = startOfLocalDay(now).getTime();
  const dayDiff = Math.round((nowStart - thenStart) / MS_DAY);
  if (dayDiff === 0) return t('home.pulseTime.today');
  if (dayDiff === 1) return t('home.pulseTime.yesterday');
  return then.toLocaleString('en-GB', { day: 'numeric', month: 'short' });
}

/**
 * Pulse feed time meta: relative under 2h; otherwise clock time (date is in the day column).
 */
export function formatPulseOccurredAt(
  iso: string,
  t: TranslateFn,
  nowMs: number = Date.now()
): string {
  const thenDate = new Date(iso);
  const diffMs = Math.max(0, nowMs - thenDate.getTime());
  if (diffMs < MS_2H) {
    const mins = Math.floor(diffMs / 60_000);
    if (mins < 1) return t('home.pulseTime.justNow');
    if (mins < 60) return t('home.pulseTime.minutesAgo', { count: mins });
    const hours = Math.floor(mins / 60);
    return t('home.pulseTime.hoursAgo', { count: hours });
  }
  return formatTime(thenDate);
}
