const DATETIME_LOCAL_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

/** Parse `<input type="datetime-local">` value as wall-clock time in the user's timezone. */
export function parseDatetimeLocalValue(value: string): Date | null {
  const match = DATETIME_LOCAL_RE.exec(value.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = match[6] != null ? Number(match[6]) : 0;

  const date = new Date(year, month - 1, day, hour, minute, second, 0);
  if (Number.isNaN(date.getTime())) return null;

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date.getHours() !== hour ||
    date.getMinutes() !== minute
  ) {
    return null;
  }

  return date;
}

/** Format a Date for `<input type="datetime-local">` in the user's local timezone. */
export function formatDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Convert local datetime-local input to UTC ISO string for the API. */
export function datetimeLocalToIso(value: string): string | null {
  const date = parseDatetimeLocalValue(value);
  return date?.toISOString() ?? null;
}

/** Convert API UTC ISO string to local datetime-local input value. */
export function isoToDatetimeLocal(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return formatDatetimeLocalValue(date);
}

export function defaultFutureDatetimeLocal(minutesAhead = 1): string {
  const date = new Date(Date.now() + minutesAhead * 60 * 1000);
  date.setSeconds(0, 0);
  return formatDatetimeLocalValue(date);
}

export function minDatetimeLocalNow(): string {
  const date = new Date();
  date.setSeconds(0, 0);
  return formatDatetimeLocalValue(date);
}

export function userTimezoneLabel(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function formatLocalDateTime(iso: string): string {
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function isDatetimeLocalInFuture(value: string, bufferMs = 1000): boolean {
  const date = parseDatetimeLocalValue(value);
  if (!date) return false;
  return date.getTime() > Date.now() + bufferMs;
}

export function sendAtFieldLabel(): string {
  return `Send at (${userTimezoneLabel()})`;
}
