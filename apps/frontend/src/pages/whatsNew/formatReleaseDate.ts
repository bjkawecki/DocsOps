/** Format manifest date `YYYY-MM-DD` for display (e.g. Jun 16, 2026). */
export function formatReleaseDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map((part) => Number.parseInt(part, 10));
  if (!year || !month || !day) return isoDate;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(year, month - 1, day));
}
