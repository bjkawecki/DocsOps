import { describe, expect, it } from 'vitest';
import { formatBackupScheduleLabel } from './backupScheduleLabel';

describe('formatBackupScheduleLabel', () => {
  it('formats daily preset', () => {
    expect(formatBackupScheduleLabel('0 3 * * *', 'UTC')).toBe('Daily at 03:00 UTC');
  });

  it('formats custom daily cron', () => {
    expect(formatBackupScheduleLabel('30 4 * * *', 'Europe/Berlin')).toBe(
      'Daily at 04:30 Europe/Berlin'
    );
  });

  it('formats weekly cron', () => {
    expect(formatBackupScheduleLabel('0 3 * * 1', 'UTC')).toBe('Weekly on Monday at 03:00 UTC');
  });

  it('formats interval cron', () => {
    expect(formatBackupScheduleLabel('*/15 * * * *', 'UTC')).toBe('Every 15 minutes (UTC)');
  });

  it('falls back to raw cron for uncommon patterns', () => {
    expect(formatBackupScheduleLabel('0 0 15 1 1', 'UTC')).toBe('0 0 15 1 1 (UTC)');
  });
});
