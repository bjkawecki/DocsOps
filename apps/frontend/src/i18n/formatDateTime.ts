import type { AppLocale } from './resolveAppLocale.js';

/** Format an ISO timestamp for display in the active app locale. */
export function formatDateTime(
  iso: string | null | undefined,
  locale: AppLocale,
  options?: Intl.DateTimeFormatOptions
): string {
  if (iso == null || iso === '') return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const tag = locale === 'de' ? 'de-DE' : 'en-GB';
  return date.toLocaleString(tag, options);
}
