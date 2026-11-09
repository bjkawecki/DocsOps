import type { TFunction } from 'i18next';

export type CronMode = 'text' | 'form';
export type CronPreset = 'everyMinutes' | 'hourly' | 'daily' | 'weekly' | 'monthly';
export type CronFormState = {
  preset: CronPreset;
  intervalMinutes: string;
  minute: string;
  hour: string;
  weekday: string;
  dayOfMonth: string;
};

export const DEFAULT_CRON_FORM: CronFormState = {
  preset: 'everyMinutes',
  intervalMinutes: '5',
  minute: '0',
  hour: '0',
  weekday: '1',
  dayOfMonth: '1',
};

export const BACKUP_JOB_NAME = 'maintenance.backup';

export const INTERVAL_OPTIONS = ['1', '2', '5', '10', '15', '30', '45', '59'];
export const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, idx) => String(idx));
export const HOUR_OPTIONS = Array.from({ length: 24 }, (_, idx) => String(idx));
export const DAY_OF_MONTH_OPTIONS = Array.from({ length: 31 }, (_, idx) => String(idx + 1));
export const PRESET_FIELD_WIDTH = 180;
export const SMALL_FIELD_WIDTH = 64;
export const WEEKDAY_FIELD_WIDTH = 120;

const WEEKDAY_VALUES = ['1', '2', '3', '4', '5', '6', '0'] as const;
const WEEKDAY_TRANSLATION_KEYS: Record<(typeof WEEKDAY_VALUES)[number], string> = {
  '1': 'monday',
  '2': 'tuesday',
  '3': 'wednesday',
  '4': 'thursday',
  '5': 'friday',
  '6': 'saturday',
  '0': 'sunday',
};

export function buildWeekdayOptions(t: TFunction): Array<{ value: string; label: string }> {
  return WEEKDAY_VALUES.map((value) => ({
    value,
    label: t(`scheduler.cronForm.weekdays.${WEEKDAY_TRANSLATION_KEYS[value]}`),
  }));
}

export function toSelectOptions(values: string[]): Array<{ value: string; label: string }> {
  return values.map((value) => ({ value, label: value }));
}

function toIntInRange(value: string, min: number, max: number): number | null {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return null;
  if (parsed < min || parsed > max) return null;
  return parsed;
}

export function buildCronFromForm(form: CronFormState): string | null {
  const minute = toIntInRange(form.minute, 0, 59);
  const hour = toIntInRange(form.hour, 0, 23);
  const dayOfMonth = toIntInRange(form.dayOfMonth, 1, 31);
  const weekday = toIntInRange(form.weekday, 0, 6);

  switch (form.preset) {
    case 'everyMinutes': {
      const interval = toIntInRange(form.intervalMinutes, 1, 59);
      return interval ? `*/${interval} * * * *` : null;
    }
    case 'hourly':
      return minute != null ? `${minute} * * * *` : null;
    case 'daily':
      return minute != null && hour != null ? `${minute} ${hour} * * *` : null;
    case 'weekly':
      return minute != null && hour != null && weekday != null
        ? `${minute} ${hour} * * ${weekday}`
        : null;
    case 'monthly':
      return minute != null && hour != null && dayOfMonth != null
        ? `${minute} ${hour} ${dayOfMonth} * *`
        : null;
    default:
      return null;
  }
}

export function parseCronToForm(cron: string): CronFormState | null {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return null;
  const [minute, hour, dayOfMonth, month, weekday] = parts;

  const everyMinutesMatch = /^\*\/(\d+)$/.exec(minute);
  if (everyMinutesMatch && hour === '*' && dayOfMonth === '*' && month === '*' && weekday === '*') {
    return {
      ...DEFAULT_CRON_FORM,
      preset: 'everyMinutes',
      intervalMinutes: everyMinutesMatch[1],
    };
  }
  if (
    /^\d+$/.test(minute) &&
    hour === '*' &&
    dayOfMonth === '*' &&
    month === '*' &&
    weekday === '*'
  ) {
    return { ...DEFAULT_CRON_FORM, preset: 'hourly', minute };
  }
  if (
    /^\d+$/.test(minute) &&
    /^\d+$/.test(hour) &&
    dayOfMonth === '*' &&
    month === '*' &&
    weekday === '*'
  ) {
    return { ...DEFAULT_CRON_FORM, preset: 'daily', minute, hour };
  }
  if (
    /^\d+$/.test(minute) &&
    /^\d+$/.test(hour) &&
    dayOfMonth === '*' &&
    month === '*' &&
    /^\d+$/.test(weekday)
  ) {
    return { ...DEFAULT_CRON_FORM, preset: 'weekly', minute, hour, weekday };
  }
  if (
    /^\d+$/.test(minute) &&
    /^\d+$/.test(hour) &&
    /^\d+$/.test(dayOfMonth) &&
    month === '*' &&
    weekday === '*'
  ) {
    return { ...DEFAULT_CRON_FORM, preset: 'monthly', minute, hour, dayOfMonth };
  }
  return null;
}
