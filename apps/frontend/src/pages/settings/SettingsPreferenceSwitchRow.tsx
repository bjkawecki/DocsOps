import { Group, Switch, Text } from '@mantine/core';

type Props = {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
};

/** Label + switch row used by notification preference cards. */
export function SettingsPreferenceSwitchRow({ label, checked, disabled, onChange }: Props) {
  return (
    <Group justify="space-between" wrap="nowrap" gap="md">
      <Text size="sm" fw={500} style={{ flex: 1, minWidth: 0 }}>
        {label}
      </Text>
      <Switch
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.currentTarget.checked)}
      />
    </Group>
  );
}
