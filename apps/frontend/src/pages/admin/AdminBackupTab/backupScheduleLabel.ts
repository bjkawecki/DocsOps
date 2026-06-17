import { BACKUP_SCHEDULE_PRESETS } from './adminBackupTypes';

const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

function pad2(value: string): string {
  return value.padStart(2, '0');
}

export function formatBackupScheduleLabel(
  cron: string | null | undefined,
  tz: string | null | undefined
): string {
  if (!cron?.trim()) return 'Scheduled';

  const normalizedCron = cron.trim();
  const tzLabel = tz?.trim() || 'UTC';

  const preset = BACKUP_SCHEDULE_PRESETS.find(
    (item) => item.cron === normalizedCron && item.tz === tzLabel
  );
  if (preset) return preset.label;

  const parts = normalizedCron.split(/\s+/);
  if (parts.length !== 5) return `${normalizedCron} (${tzLabel})`;

  const [minute, hour, dayOfMonth, , weekday] = parts;

  const intervalMatch = /^\*\/(\d+)$/.exec(minute);
  if (intervalMatch && hour === '*' && dayOfMonth === '*' && weekday === '*') {
    return `Every ${intervalMatch[1]} minutes (${tzLabel})`;
  }

  if (hour === '*' && dayOfMonth === '*' && weekday === '*') {
    return `Hourly at :${pad2(minute)} (${tzLabel})`;
  }

  if (dayOfMonth === '*' && weekday !== '*') {
    const dow = WEEKDAYS[Number.parseInt(weekday, 10)] ?? weekday;
    return `Weekly on ${dow} at ${pad2(hour)}:${pad2(minute)} ${tzLabel}`;
  }

  if (dayOfMonth === '*' && weekday === '*') {
    return `Daily at ${pad2(hour)}:${pad2(minute)} ${tzLabel}`;
  }

  if (dayOfMonth !== '*' && weekday === '*') {
    return `Monthly on day ${dayOfMonth} at ${pad2(hour)}:${pad2(minute)} ${tzLabel}`;
  }

  return `${normalizedCron} (${tzLabel})`;
}
