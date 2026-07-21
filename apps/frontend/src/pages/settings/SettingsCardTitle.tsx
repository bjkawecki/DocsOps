import { Group, Text, type TextProps } from '@mantine/core';
import { SETTINGS_JUMP_LABELS, type SettingsJumpId } from './settingsLayout.js';
import { SETTINGS_JUMP_ICON_COMPONENTS, SETTINGS_JUMP_ICON_SIZE } from './settingsIcons.js';

/** Prominent settings card heading with section icon. */
export function SettingsCardTitle({
  jumpId,
  ...rest
}: { jumpId: SettingsJumpId } & Omit<TextProps, 'children'>) {
  const Icon = SETTINGS_JUMP_ICON_COMPONENTS[jumpId];
  return (
    <Group gap="xs" wrap="nowrap" align="center">
      <Icon size={SETTINGS_JUMP_ICON_SIZE} stroke={1.5} aria-hidden />
      <Text fw={700} size="md" lh={1.3} {...rest}>
        {SETTINGS_JUMP_LABELS[jumpId]}
      </Text>
    </Group>
  );
}
