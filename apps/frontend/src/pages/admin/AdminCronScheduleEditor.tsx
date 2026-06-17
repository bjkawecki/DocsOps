import { Box, Group, Radio, Select, Stack, Text, TextInput } from '@mantine/core';
import {
  buildCronFromForm,
  DAY_OF_MONTH_OPTIONS,
  DEFAULT_CRON_FORM,
  HOUR_OPTIONS,
  INTERVAL_OPTIONS,
  MINUTE_OPTIONS,
  parseCronToForm,
  type CronFormState,
  type CronMode,
  type CronPreset,
  toSelectOptions,
  WEEKDAY_OPTIONS,
} from './adminCronScheduleUtils.js';

const PRESET_FIELD_WIDTH = 180;
const SMALL_FIELD_WIDTH = 64;
const WEEKDAY_FIELD_WIDTH = 120;

type AdminCronScheduleEditorProps = {
  cronMode: CronMode;
  onCronModeChange: (mode: CronMode) => void;
  cronText: string;
  onCronTextChange: (value: string) => void;
  formValue: CronFormState;
  onFormChange: (value: CronFormState) => void;
  resolvedCron: string | null;
  compact?: boolean;
};

export function AdminCronScheduleEditor({
  cronMode,
  onCronModeChange,
  cronText,
  onCronTextChange,
  formValue,
  onFormChange,
  resolvedCron,
  compact = false,
}: AdminCronScheduleEditorProps) {
  return (
    <Stack gap="sm">
      <Radio.Group
        value={cronMode}
        onChange={(value) => onCronModeChange(value as CronMode)}
        label="Cron mode"
      >
        <Group gap="md">
          <Radio value="text" label="Text" />
          <Radio value="form" label="Form" />
        </Group>
      </Radio.Group>
      {cronMode === 'text' ? (
        <TextInput
          label="Cron expression"
          value={cronText}
          onChange={(event) => onCronTextChange(event.currentTarget.value)}
          placeholder="0 9 * * *"
        />
      ) : (
        <Box style={{ overflowX: compact ? undefined : 'auto' }}>
          <Group gap={6} wrap={compact ? 'wrap' : 'nowrap'} align="flex-end">
            <Select
              size="xs"
              label="Preset"
              value={formValue.preset}
              data={[
                { value: 'everyMinutes', label: 'Every X minutes' },
                { value: 'hourly', label: 'Hourly' },
                { value: 'daily', label: 'Daily' },
                { value: 'weekly', label: 'Weekly' },
                { value: 'monthly', label: 'Monthly' },
              ]}
              onChange={(value) => {
                if (!value) return;
                onFormChange({ ...formValue, preset: value as CronPreset });
              }}
              style={{
                width: PRESET_FIELD_WIDTH,
                minWidth: PRESET_FIELD_WIDTH,
                maxWidth: PRESET_FIELD_WIDTH,
              }}
            />
            <Select
              size="xs"
              label="Interval"
              value={formValue.intervalMinutes}
              data={toSelectOptions(INTERVAL_OPTIONS)}
              onChange={(value) => {
                if (!value) return;
                onFormChange({ ...formValue, intervalMinutes: value });
              }}
              disabled={formValue.preset !== 'everyMinutes'}
              style={{
                width: SMALL_FIELD_WIDTH,
                minWidth: SMALL_FIELD_WIDTH,
                maxWidth: SMALL_FIELD_WIDTH,
              }}
            />
            <Select
              size="xs"
              label="Minute"
              value={formValue.minute}
              data={toSelectOptions(MINUTE_OPTIONS)}
              onChange={(value) => {
                if (!value) return;
                onFormChange({ ...formValue, minute: value });
              }}
              disabled={formValue.preset === 'everyMinutes'}
              style={{
                width: SMALL_FIELD_WIDTH,
                minWidth: SMALL_FIELD_WIDTH,
                maxWidth: SMALL_FIELD_WIDTH,
              }}
            />
            <Select
              size="xs"
              label="Hour"
              value={formValue.hour}
              data={toSelectOptions(HOUR_OPTIONS)}
              onChange={(value) => {
                if (!value) return;
                onFormChange({ ...formValue, hour: value });
              }}
              disabled={!['daily', 'weekly', 'monthly'].includes(formValue.preset)}
              style={{
                width: SMALL_FIELD_WIDTH,
                minWidth: SMALL_FIELD_WIDTH,
                maxWidth: SMALL_FIELD_WIDTH,
              }}
            />
            <Select
              size="xs"
              label="Weekday"
              value={formValue.weekday}
              data={WEEKDAY_OPTIONS}
              onChange={(value) => {
                if (!value) return;
                onFormChange({ ...formValue, weekday: value });
              }}
              disabled={formValue.preset !== 'weekly'}
              style={{
                width: WEEKDAY_FIELD_WIDTH,
                minWidth: WEEKDAY_FIELD_WIDTH,
                maxWidth: WEEKDAY_FIELD_WIDTH,
              }}
            />
            <Select
              size="xs"
              label="Day"
              value={formValue.dayOfMonth}
              data={toSelectOptions(DAY_OF_MONTH_OPTIONS)}
              onChange={(value) => {
                if (!value) return;
                onFormChange({ ...formValue, dayOfMonth: value });
              }}
              disabled={formValue.preset !== 'monthly'}
              style={{
                width: SMALL_FIELD_WIDTH,
                minWidth: SMALL_FIELD_WIDTH,
                maxWidth: SMALL_FIELD_WIDTH,
              }}
            />
          </Group>
        </Box>
      )}
      <Text size="xs" c="dimmed">
        Cron preview: {resolvedCron ?? buildCronFromForm(formValue) ?? 'invalid'}
      </Text>
    </Stack>
  );
}

export function createInitialCronScheduleState(initialCron = '0 9 * * *'): {
  cronMode: CronMode;
  cronText: string;
  formValue: CronFormState;
} {
  return {
    cronMode: 'form',
    cronText: initialCron,
    formValue: parseCronToForm(initialCron) ?? DEFAULT_CRON_FORM,
  };
}
