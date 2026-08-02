import {
  Alert,
  Box,
  ColorSwatch,
  Group,
  Loader,
  Paper,
  SegmentedControl,
  Select,
  Stack,
  Switch,
  Text,
} from '@mantine/core';
import { useMantineColorScheme } from '@mantine/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../api/client';
import type {
  DocumentReadingFontPreference,
  UserPreferences,
} from '../../components/system/ThemeFromPreferences';
import { SettingsContentCard } from './SettingsContentCard.js';
import { COLOR_SCHEME_STORAGE_KEY } from '../../constants';
import { meQueryKey, useMe } from '../../hooks/useMe';
import {
  getPrimaryColorAccent,
  PRIMARY_COLOR_PRESET_LABELS,
  PRIMARY_COLOR_PRESETS,
  TEXT_SIZE_OPTION_LABELS,
  TEXT_SIZE_SCALE_PERCENT,
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
  const { t } = useTranslation('settings');
  const queryClient = useQueryClient();
  const { setColorScheme } = useMantineColorScheme();
  const { data, isPending, isError, error } = useMe();

  // Mantine's setColorScheme identity is unstable; keep latest via ref.
  const setColorSchemeRef = useRef(setColorScheme);
  setColorSchemeRef.current = setColorScheme;

  // Sync Mantine scheme when preference is known (do not force 'auto' while me is loading)
  useEffect(() => {
    const preferred = data?.preferences?.theme;
    if (preferred === undefined) return;
    setColorSchemeRef.current(preferred);
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
        notifications.show({ message: t('appearance.toasts.themeSaved'), color: 'green' });
      }
      if (variables.sidebarPinned !== undefined) {
        notifications.show({
          message: variables.sidebarPinned
            ? t('appearance.toasts.sidebarPinned')
            : t('appearance.toasts.sidebarUnpinned'),
          color: 'green',
        });
      }
      if (variables.primaryColor !== undefined) {
        notifications.show({ message: t('appearance.toasts.primaryColorSaved'), color: 'green' });
      }
      if (variables.locale !== undefined) {
        notifications.show({ message: t('appearance.toasts.localeSaved'), color: 'green' });
      }
      if (variables.textSize !== undefined) {
        notifications.show({ message: t('appearance.toasts.textSizeSaved'), color: 'green' });
      }
      if (variables.documentReadingFont !== undefined) {
        notifications.show({ message: t('appearance.toasts.readingFontSaved'), color: 'green' });
      }
    },
    onError: (err: Error) => {
      notifications.show({
        title: t('appearance.toasts.saveFailed'),
        message: err.message,
        color: 'red',
      });
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
  const documentReadingFont: DocumentReadingFontPreference =
    preferences?.documentReadingFont === 'serif' ? 'serif' : 'sans';
  const locale = preferences?.locale ?? 'en';

  return (
    <SettingsContentCard id={settingsCardDomId('appearance')} data-settings-card="appearance">
      <Stack gap={SETTINGS_CARD_STACK_GAP}>
        <SettingsCardTitle jumpId="appearance" label={t('appearance.title')} />
        <Group justify="space-between" align="flex-start" wrap="nowrap" gap="md">
          <Stack gap={SETTINGS_FIELD_LABEL_GAP} style={{ flex: 1, minWidth: 0 }}>
            <Text size="sm" fw={500}>
              {t('appearance.theme')}
            </Text>
            <Text size="xs" c="dimmed">
              {t('appearance.themeDescription')}
            </Text>
          </Stack>
          <SegmentedControl
            value={theme}
            onChange={(value) =>
              patchPreferences.mutate({ theme: value as 'light' | 'dark' | 'auto' })
            }
            data={[
              { label: t('appearance.themeLight'), value: 'light' },
              { label: t('appearance.themeDark'), value: 'dark' },
              { label: t('appearance.themeAuto'), value: 'auto' },
            ]}
            disabled={patchPreferences.isPending}
          />
        </Group>
        <Group justify="space-between" align="center" wrap="nowrap" gap="md">
          <Stack gap={SETTINGS_FIELD_LABEL_GAP} style={{ flex: 1, minWidth: 0 }}>
            <Text size="sm" fw={500}>
              {t('appearance.pinSidebar')}
            </Text>
            <Text size="xs" c="dimmed">
              {t('appearance.pinSidebarDescription')}
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
              {t('appearance.primaryColor')}
            </Text>
            <Text size="xs" c="dimmed">
              {t('appearance.primaryColorDescription')}
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
        <Stack gap={SETTINGS_FIELD_LABEL_GAP}>
          <Group justify="space-between" align="flex-start" wrap="nowrap" gap="md">
            <Stack gap={SETTINGS_FIELD_LABEL_GAP} style={{ flex: 1, minWidth: 0 }}>
              <Text size="sm" fw={500} id="settings-text-size-label">
                {t('appearance.textSize')}
              </Text>
              <Text size="xs" c="dimmed" id="settings-text-size-description">
                {t('appearance.textSizeDescription')} {TEXT_SIZE_SCALE_PERCENT[textSize]}%.
              </Text>
            </Stack>
            <SegmentedControl
              value={textSize}
              onChange={(value) =>
                patchPreferences.mutate({ textSize: value as TextSizePreference })
              }
              data={(Object.keys(TEXT_SIZE_OPTION_LABELS) as TextSizePreference[]).map((value) => ({
                value,
                label: TEXT_SIZE_OPTION_LABELS[value],
              }))}
              disabled={patchPreferences.isPending}
              aria-labelledby="settings-text-size-label"
              aria-describedby="settings-text-size-description"
            />
          </Group>
          <Paper
            withBorder
            p="sm"
            radius="sm"
            aria-hidden
            style={{ maxWidth: 420 }}
            className="document-content"
          >
            <Box component="p" mb={0} style={{ marginBottom: 0 }}>
              Preview: Interface and document text scale together. This sample uses the document
              reading font.
            </Box>
          </Paper>
        </Stack>
        <Group justify="space-between" align="flex-start" wrap="nowrap" gap="md">
          <Stack gap={SETTINGS_FIELD_LABEL_GAP} style={{ flex: 1, minWidth: 0 }}>
            <Text size="sm" fw={500}>
              {t('appearance.readingFont')}
            </Text>
            <Text size="xs" c="dimmed">
              {t('appearance.readingFontDescription')}
            </Text>
          </Stack>
          <SegmentedControl
            value={documentReadingFont}
            onChange={(value) =>
              patchPreferences.mutate({
                documentReadingFont: value as DocumentReadingFontPreference,
              })
            }
            data={[
              { label: t('appearance.readingFontSans'), value: 'sans' },
              { label: t('appearance.readingFontSerif'), value: 'serif' },
            ]}
            disabled={patchPreferences.isPending}
          />
        </Group>
        <Group justify="space-between" align="flex-start" wrap="nowrap" gap="md">
          <Stack gap={SETTINGS_FIELD_LABEL_GAP} style={{ flex: 1, minWidth: 0 }}>
            <Text size="sm" fw={500}>
              {t('appearance.locale')}
            </Text>
            <Text size="xs" c="dimmed">
              {t('appearance.localeDescription')}
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
              { label: t('appearance.localeEn'), value: 'en' },
              { label: t('appearance.localeDe'), value: 'de' },
            ]}
            disabled={patchPreferences.isPending}
            w={160}
          />
        </Group>
      </Stack>
    </SettingsContentCard>
  );
}
