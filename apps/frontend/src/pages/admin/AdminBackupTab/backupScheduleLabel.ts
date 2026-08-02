import type { TranslateFn } from './adminBackupTypes';

const WEEKDAY_KEYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;

function pad2(value: string): string {
  return value.padStart(2, '0');
}

export function formatBackupScheduleLabel(
  cron: string | null | undefined,
  tz: string | null | undefined,
  t: TranslateFn
): string {
  if (!cron?.trim()) return t('backup.schedule.scheduled');

  const normalizedCron = cron.trim();
  const tzLabel = tz?.trim() || 'UTC';

  const parts = normalizedCron.split(/\s+/);
  if (parts.length !== 5) {
    return t('backup.schedule.rawCron', { cron: normalizedCron, tz: tzLabel });
  }

  const [minute, hour, dayOfMonth, , weekday] = parts;

  const intervalMatch = /^\*\/(\d+)$/.exec(minute);
  if (intervalMatch && hour === '*' && dayOfMonth === '*' && weekday === '*') {
    return t('backup.schedule.everyMinutes', { minutes: intervalMatch[1], tz: tzLabel });
  }

  if (hour === '*' && dayOfMonth === '*' && weekday === '*') {
    return t('backup.schedule.hourlyAt', { minute: pad2(minute), tz: tzLabel });
  }

  if (dayOfMonth === '*' && weekday !== '*') {
    const dowKey = WEEKDAY_KEYS[Number.parseInt(weekday, 10)];
    const day = dowKey ? t(`backup.schedule.weekdays.${dowKey}`) : weekday;
    return t('backup.schedule.weeklyOn', {
      day,
      time: `${pad2(hour)}:${pad2(minute)}`,
      tz: tzLabel,
    });
  }

  if (dayOfMonth === '*' && weekday === '*') {
    return t('backup.schedule.dailyAt', { time: `${pad2(hour)}:${pad2(minute)}`, tz: tzLabel });
  }

  if (dayOfMonth !== '*' && weekday === '*') {
    return t('backup.schedule.monthlyOn', {
      day: dayOfMonth,
      time: `${pad2(hour)}:${pad2(minute)}`,
      tz: tzLabel,
    });
  }

  return t('backup.schedule.rawCron', { cron: normalizedCron, tz: tzLabel });
}
