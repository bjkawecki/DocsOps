import { describe, expect, it } from 'vitest';
import i18n from '../../../i18n/i18n';
import { formatBackupScheduleLabel } from './backupScheduleLabel';

const t = (key: string, options?: Record<string, unknown>) =>
  i18n.t(key, { ns: 'admin', ...options });

describe('formatBackupScheduleLabel', () => {
  it('formats daily preset', () => {
    expect(formatBackupScheduleLabel('0 3 * * *', 'UTC', t)).toBe('Daily at 03:00 UTC');
  });

  it('formats custom daily cron', () => {
    expect(formatBackupScheduleLabel('30 4 * * *', 'Europe/Berlin', t)).toBe(
      'Daily at 04:30 Europe/Berlin'
    );
  });

  it('formats weekly cron', () => {
    expect(formatBackupScheduleLabel('0 3 * * 1', 'UTC', t)).toBe('Weekly on Monday at 03:00 UTC');
  });

  it('formats interval cron', () => {
    expect(formatBackupScheduleLabel('*/15 * * * *', 'UTC', t)).toBe('Every 15 minutes (UTC)');
  });

  it('falls back to raw cron for uncommon patterns', () => {
    expect(formatBackupScheduleLabel('0 0 15 1 1', 'UTC', t)).toBe('0 0 15 1 1 (UTC)');
  });
});
