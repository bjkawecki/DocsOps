import {
  Alert,
  ColorSwatch,
  Group,
  Loader,
  SegmentedControl,
  Select,
  Stack,
  Switch,
  Text,
} from '@mantine/core';
import { useMantineColorScheme } from '@mantine/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { useEffect } from 'react';
import { apiFetch } from '../../api/client';
import type { UserPreferences } from '../../components/system/ThemeFromPreferences';
import { SettingsContentCard } from './SettingsContentCard.js';
import { COLOR_SCHEME_STORAGE_KEY } from '../../constants';
import { meQueryKey, useMe } from '../../hooks/useMe';
import {
  getPrimaryColorAccent,
  PRIMARY_COLOR_PRESET_LABELS,
  PRIMARY_COLOR_PRESETS,
  type PrimaryColorPreset,
  type TextSizePreference,
} from '../../theme';
import {
  SETTINGS_CARD_STACK_GAP,
  SETTINGS_FIELD_LABEL_GAP,
  settingsCardDomId,
} from './settingsLayout.js';
import { SettingsCardTitle } from './SettingsCardTitle.js';

/** Readable label/icon color on a preset accent background. */
function contrastOnAccent(hex: string): string {
  const raw = hex.replace('#', '');
  if (raw.length !== 6) return '#fff';
  const r = Number.parseInt(raw.slice(0, 2), 16);
  const g = Number.parseInt(raw.slice(2, 4), 16);
  const b = Number.parseInt(raw.slice(4, 6), 16);
  // Relative luminance (sRGB)
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.55 ? 'var(--mantine-color-black)' : 'var(--mantine-color-white)';
}
export function SettingsAppearanceTab() {
  const queryClient = useQueryClient();
  const { setColorScheme } = useMantineColorScheme();
  const { data, isPending, isError, error } = useMe();

  // Sync Mantine scheme when preference is known (do not force 'auto' while me is loading)
  useEffect(() => {
    const preferred = data?.preferences?.theme;
    if (preferred === undefined) return;
    setColorScheme(preferred);
    // setColorScheme from useMantineColorScheme is unstable; sync only on theme change
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [data?.preferences?.theme]);

  const patchPreferences = useMutation({
    mutationFn: async (body: Partial<UserPreferences>) => {
      const res = await apiFetch('/api/v1/me/preferences', {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to save preferences');
      return res.json() as Promise<UserPreferences>;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['me', 'preferences'] });
      void queryClient.invalidateQueries({ queryKey: meQueryKey });
      if (variables.theme !== undefined) {
        setColorScheme(variables.theme);
        try {
          window.localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, variables.theme);
        } catch {
          // ignore localStorage errors (e.g. private mode)
        }
        notifications.show({
          title: 'Theme updated',
          message: `Color scheme set to ${variables.theme}.`,
          color: 'green',
        });
      }
      if (variables.sidebarPinned !== undefined) {
        notifications.show({
          title: 'Sidebar preference saved',
          message: variables.sidebarPinned ? 'Sidebar is pinned.' : 'Sidebar can be collapsed.',
          color: 'green',
        });
      }
      if (variables.primaryColor !== undefined) {
        notifications.show({
          title: 'Primary color updated',
          message: 'Accent color has been updated.',
          color: 'green',
        });
      }
      if (variables.locale !== undefined) {
        notifications.show({
          title: 'Language saved',
          message: 'Your language preference has been updated.',
          color: 'green',
        });
      }
      if (variables.textSize !== undefined) {
        notifications.show({
          title: 'Text size updated',
          message: 'Interface text scale has been updated.',
          color: 'green',
        });
      }
    },
    onError: (err: Error) => {
      notifications.show({ title: 'Save failed', message: err.message, color: 'red' });
    },
  });

  if (isPending || !data) {
    return (
      <SettingsContentCard id={settingsCardDomId('appearance')} data-settings-card="appearance">
        <Loader size="sm" />
      </SettingsContentCard>
    );
  }
  if (isError) {
    return (
      <Alert color="red" title="Error">
        {error?.message}
      </Alert>
    );
  }

  const preferences = data.preferences;
  const theme = preferences?.theme ?? 'auto';
  const sidebarPinned = preferences?.sidebarPinned ?? false;
  const primaryColor: PrimaryColorPreset = preferences?.primaryColor ?? 'blue';
  const primaryAccent = getPrimaryColorAccent(primaryColor);
  const primaryAccentFg = contrastOnAccent(primaryAccent);
  const textSize: TextSizePreference = preferences?.textSize ?? 'default';
  const locale = preferences?.locale ?? 'en';

  return (
    <SettingsContentCard id={settingsCardDomId('appearance')} data-settings-card="appearance">
      <Stack gap={SETTINGS_CARD_STACK_GAP}>
        <SettingsCardTitle jumpId="appearance" />
        <Group justify="space-between" align="flex-start" wrap="nowrap" gap="md">
          <Stack gap={SETTINGS_FIELD_LABEL_GAP} style={{ flex: 1, minWidth: 0 }}>
            <Text size="sm" fw={500}>
              Theme
            </Text>
            <Text size="xs" c="dimmed">
              Change the theme mode.
            </Text>
          </Stack>
          <SegmentedControl
            value={theme}
            onChange={(value) =>
              patchPreferences.mutate({ theme: value as 'light' | 'dark' | 'auto' })
            }
            data={[
              { label: 'Light', value: 'light' },
              { label: 'Dark', value: 'dark' },
              { label: 'Auto', value: 'auto' },
            ]}
            disabled={patchPreferences.isPending}
          />
        </Group>
        <Group justify="space-between" align="center" wrap="nowrap" gap="md">
          <Stack gap={SETTINGS_FIELD_LABEL_GAP} style={{ flex: 1, minWidth: 0 }}>
            <Text size="sm" fw={500}>
              Pin sidebar
            </Text>
            <Text size="xs" c="dimmed">
              Start with the sidebar expanded on desktop. You can still collapse it anytime. On
              mobile, navigation always opens from the menu button.
            </Text>
          </Stack>
          <Switch
            checked={sidebarPinned}
            onChange={(e) => patchPreferences.mutate({ sidebarPinned: e.currentTarget.checked })}
            disabled={patchPreferences.isPending}
          />
        </Group>
        <Group justify="space-between" align="flex-start" wrap="nowrap" gap="md">
          <Stack gap={SETTINGS_FIELD_LABEL_GAP} style={{ flex: 1, minWidth: 0 }}>
            <Text size="sm" fw={500}>
              Primary color
            </Text>
            <Text size="xs" c="dimmed">
              Accent color for links, tabs, and buttons.
            </Text>
          </Stack>
          <Select
            value={primaryColor}
            onChange={(value) => {
              if (value !== null && (PRIMARY_COLOR_PRESETS as readonly string[]).includes(value)) {
                patchPreferences.mutate({
                  primaryColor: value as PrimaryColorPreset,
                });
              }
            }}
            data={[...PRIMARY_COLOR_PRESETS]
              .sort((a, b) =>
                PRIMARY_COLOR_PRESET_LABELS[a].localeCompare(PRIMARY_COLOR_PRESET_LABELS[b])
              )
              .map((preset) => ({
                label: PRIMARY_COLOR_PRESET_LABELS[preset],
                value: preset,
              }))}
            disabled={patchPreferences.isPending}
            w={200}
            renderOption={({ option }) => {
              const preset = option.value as PrimaryColorPreset;
              return (
                <Group gap="xs" wrap="nowrap">
                  <ColorSwatch color={getPrimaryColorAccent(preset)} size={14} withShadow={false} />
                  <span>{option.label}</span>
                </Group>
              );
            }}
            styles={{
              option: { whiteSpace: 'nowrap' },
              input: {
                backgroundColor: primaryAccent,
                color: primaryAccentFg,
                borderColor: primaryAccent,
              },
              section: {
                color: primaryAccentFg,
              },
            }}
          />
        </Group>
        <Group justify="space-between" align="flex-start" wrap="nowrap" gap="md">
          <Stack gap={SETTINGS_FIELD_LABEL_GAP} style={{ flex: 1, minWidth: 0 }}>
            <Text size="sm" fw={500}>
              Text size
            </Text>
            <Text size="xs" c="dimmed">
              Improves readability; applies across the app.
            </Text>
          </Stack>
          <SegmentedControl
            value={textSize}
            onChange={(value) => patchPreferences.mutate({ textSize: value as TextSizePreference })}
            data={[
              { label: 'Default', value: 'default' },
              { label: 'Large', value: 'large' },
              { label: 'Larger', value: 'larger' },
            ]}
            disabled={patchPreferences.isPending}
          />
        </Group>
        <Group justify="space-between" align="flex-start" wrap="nowrap" gap="md">
          <Stack gap={SETTINGS_FIELD_LABEL_GAP} style={{ flex: 1, minWidth: 0 }}>
            <Text size="sm" fw={500}>
              Interface language
            </Text>
            <Text size="xs" c="dimmed">
              Language for the user interface.
            </Text>
          </Stack>
          <Select
            value={locale}
            onChange={(value) => {
              if (value === 'en' || value === 'de') {
                patchPreferences.mutate({ locale: value });
              }
            }}
            data={[
              { label: 'English', value: 'en' },
              { label: 'Deutsch', value: 'de' },
            ]}
            disabled={patchPreferences.isPending}
            w={160}
          />
        </Group>
      </Stack>
    </SettingsContentCard>
  );
}
