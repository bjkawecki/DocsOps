import type { ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ActionIcon,
  Avatar,
  Badge,
  Box,
  Burger,
  Group,
  Menu,
  SegmentedControl,
  Text,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import { useMantineColorScheme } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  IconBell,
  IconDeviceDesktop,
  IconHelp,
  IconLogout,
  IconMoon,
  IconSettings,
  IconShield,
  IconSparkles,
  IconSun,
} from '@tabler/icons-react';
import type { UseMutationResult } from '@tanstack/react-query';
import { apiFetch } from '../../api/client.js';
import type { MeResponse } from '../../api/me-types.js';
import { COLOR_SCHEME_STORAGE_KEY } from '../../constants.js';
import { meQueryKey } from '../../hooks/useMe.js';
import { useWhatsNewBadge } from '../../hooks/useWhatsNewBadge.js';
import type { UserPreferences } from '../system/ThemeFromPreferences.js';
import { useIdentityScopePeopleControl } from '../scopePeople/useIdentityScopePeopleControl.js';
import {
  closeSettingsSearchParams,
  DEFAULT_SETTINGS_JUMP_ID,
  isSettingsOpen,
  openSettingsSearchParams,
} from '../../pages/settings/settingsLayout.js';
import { useTranslation } from 'react-i18next';
import { isActive } from './appShellNavUtils.js';
import { MAIN_NAV_ID } from './appShellLayoutConstants.js';

type Props = {
  mobileOpened: boolean;
  onToggleMobile: () => void;
  pathname: string;
  unreadNotificationsCount: number;
  me: MeResponse | undefined;
  accountMenuOpen: boolean;
  setAccountMenuOpen: (open: boolean) => void;
  logout: UseMutationResult<void, Error, void, unknown>;
};

function accountInitials(name: string | undefined): string {
  if (!name?.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function AppShellTopBar({
  mobileOpened,
  onToggleMobile,
  pathname,
  unreadNotificationsCount,
  me,
  accountMenuOpen,
  setAccountMenuOpen,
  logout,
}: Props) {
  const { t } = useTranslation('shell');
  const displayName = me?.user?.name ?? t('account.menu');
  const showWhatsNewBadge = useWhatsNewBadge();
  const hasNotifBadge = unreadNotificationsCount > 0;
  const [searchParams, setSearchParams] = useSearchParams();
  const notifActive = isActive('/notifications', pathname);
  const settingsActive = isSettingsOpen(searchParams);
  const helpActive = isActive('/help', pathname);
  const { setColorScheme } = useMantineColorScheme();
  const queryClient = useQueryClient();
  const theme = me?.preferences?.theme ?? 'auto';
  const peopleControl = useIdentityScopePeopleControl();

  const toggleSettings = () => {
    setSearchParams(
      (prev) =>
        isSettingsOpen(prev)
          ? closeSettingsSearchParams(prev)
          : openSettingsSearchParams(prev, DEFAULT_SETTINGS_JUMP_ID),
      { replace: true }
    );
  };

  const patchTheme = useMutation({
    mutationFn: async (nextTheme: 'light' | 'dark' | 'auto') => {
      const res = await apiFetch('/api/v1/me/preferences', {
        method: 'PATCH',
        body: JSON.stringify({ theme: nextTheme }),
      });
      if (!res.ok) throw new Error('Failed to save preferences');
      return res.json() as Promise<UserPreferences>;
    },
    onMutate: async (nextTheme) => {
      await queryClient.cancelQueries({ queryKey: meQueryKey });
      await queryClient.cancelQueries({ queryKey: ['me', 'preferences'] });
      const previousMe = queryClient.getQueryData<MeResponse>(meQueryKey);
      const previousPrefs = queryClient.getQueryData<UserPreferences>(['me', 'preferences']);
      queryClient.setQueryData(meQueryKey, (old: MeResponse | undefined) => {
        if (!old) return old;
        return {
          ...old,
          preferences: { ...old.preferences, theme: nextTheme },
        };
      });
      queryClient.setQueryData(['me', 'preferences'], (old: UserPreferences | undefined) => ({
        ...(old ?? {}),
        theme: nextTheme,
      }));
      setColorScheme(nextTheme);
      try {
        window.localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, nextTheme);
      } catch {
        // ignore localStorage errors
      }
      return { previousMe, previousPrefs };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['me', 'preferences'], data);
      queryClient.setQueryData(meQueryKey, (old: MeResponse | undefined) => {
        if (!old) return old;
        return {
          ...old,
          preferences: { ...old.preferences, ...data },
        };
      });
      notifications.show({
        message: t('toasts.themeUpdated'),
        color: 'green',
      });
    },
    onError: (err: Error, _nextTheme, context) => {
      if (context?.previousMe) {
        queryClient.setQueryData(meQueryKey, context.previousMe);
      }
      if (context?.previousPrefs !== undefined) {
        queryClient.setQueryData(['me', 'preferences'], context.previousPrefs);
      }
      const rollback = context?.previousMe?.preferences?.theme ?? 'auto';
      setColorScheme(rollback);
      notifications.show({
        title: t('toasts.themeUpdateFailed'),
        message: err.message,
        color: 'red',
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['me', 'preferences'] });
      void queryClient.invalidateQueries({ queryKey: meQueryKey });
    },
  });

  const utilIcon = (
    to: string,
    label: string,
    icon: ReactNode,
    active: boolean,
    badge?: boolean
  ) => (
    <Tooltip label={label} withArrow>
      <ActionIcon
        component={Link}
        to={to}
        variant={active ? 'light' : 'subtle'}
        size={32}
        className="app-shell-top-bar-action"
        aria-label={
          badge && hasNotifBadge
            ? t('account.notificationsUnread', { count: unreadNotificationsCount })
            : label
        }
        style={{ color: 'var(--mantine-primary-color-4)' }}
      >
        {badge && hasNotifBadge ? (
          <Box className="app-shell-sidebar-icon-wrap" component="span">
            {icon}
            <span className="app-shell-sidebar-badge-dot" aria-hidden="true" />
          </Box>
        ) : (
          icon
        )}
      </ActionIcon>
    </Tooltip>
  );

  return (
    <div className="app-shell-top-bar">
      <Group justify="space-between" align="center" wrap="nowrap" gap="sm" w="100%">
        <Group gap="sm" wrap="nowrap">
          <Burger
            hiddenFrom="sm"
            opened={mobileOpened}
            onClick={onToggleMobile}
            size="md"
            className="app-shell-top-bar-burger"
            aria-label={mobileOpened ? t('nav.closeMenu') : t('nav.openMenu')}
            aria-expanded={mobileOpened}
            aria-controls={MAIN_NAV_ID}
          />
        </Group>
        <Group
          gap={8}
          wrap="nowrap"
          justify="flex-end"
          className="app-shell-top-bar-actions"
          style={{ marginLeft: 'auto' }}
        >
          {peopleControl != null && (
            <>
              <Box className="app-shell-top-bar-people">{peopleControl}</Box>
              <Box
                className="app-shell-top-bar-people-sep"
                aria-hidden
                style={{
                  width: 1,
                  alignSelf: 'stretch',
                  minHeight: 20,
                  marginInline: 8,
                  backgroundColor: 'var(--mantine-color-default-border)',
                }}
              />
            </>
          )}
          {utilIcon(
            '/notifications',
            t('account.notifications'),
            <IconBell size={18} stroke={1.75} />,
            notifActive,
            true
          )}
          <Tooltip label={t('account.settings')} withArrow>
            <ActionIcon
              variant={settingsActive ? 'light' : 'subtle'}
              size={32}
              className="app-shell-top-bar-action"
              aria-label={t('account.settings')}
              aria-pressed={settingsActive}
              onClick={toggleSettings}
              style={{ color: 'var(--mantine-primary-color-4)' }}
            >
              <IconSettings size={18} stroke={1.75} />
            </ActionIcon>
          </Tooltip>
          {utilIcon(
            '/help/overview',
            t('account.help'),
            <IconHelp size={18} stroke={1.75} />,
            helpActive
          )}
          <Menu
            position="bottom-end"
            shadow="md"
            width={260}
            opened={accountMenuOpen}
            onChange={setAccountMenuOpen}
            closeOnItemClick={false}
          >
            <Menu.Target>
              <UnstyledButton
                data-user-menu-trigger
                aria-haspopup="menu"
                aria-expanded={accountMenuOpen}
                aria-label={t('account.menuAria', { name: displayName })}
                className="app-shell-account-brand-trigger"
              >
                <Avatar size={32} radius="50%" color="var(--mantine-primary-color-filled)">
                  {accountInitials(me?.user?.name)}
                </Avatar>
              </UnstyledButton>
            </Menu.Target>
            <Menu.Dropdown data-user-menu-dropdown>
              <Menu.Label>
                <Text size="sm" fw={600} truncate>
                  {displayName}
                </Text>
                {me?.user?.email ? (
                  <Text size="xs" c="dimmed" truncate>
                    {me.user.email}
                  </Text>
                ) : null}
              </Menu.Label>
              <Menu.Divider />
              <Box
                px="sm"
                py="xs"
                onMouseDown={(event) => event.stopPropagation()}
                onClick={(event) => event.stopPropagation()}
              >
                <Group justify="space-between" align="center" wrap="nowrap" gap="sm">
                  <Text size="sm">{t('account.theme')}</Text>
                  <SegmentedControl
                    size="xs"
                    value={theme}
                    aria-label={t('account.colorScheme')}
                    onChange={(value) => {
                      if (value === 'light' || value === 'dark' || value === 'auto') {
                        patchTheme.mutate(value);
                      }
                    }}
                    disabled={patchTheme.isPending}
                    data={[
                      {
                        value: 'auto',
                        label: (
                          <span title={t('account.themeSystem')}>
                            <IconDeviceDesktop size={14} stroke={1.75} aria-hidden />
                          </span>
                        ),
                      },
                      {
                        value: 'light',
                        label: (
                          <span title={t('account.themeLight')}>
                            <IconSun size={14} stroke={1.75} aria-hidden />
                          </span>
                        ),
                      },
                      {
                        value: 'dark',
                        label: (
                          <span title={t('account.themeDark')}>
                            <IconMoon size={14} stroke={1.75} aria-hidden />
                          </span>
                        ),
                      },
                    ]}
                  />
                </Group>
              </Box>
              <Menu.Item
                component={Link}
                to="/whats-new"
                leftSection={<IconSparkles size={14} />}
                rightSection={
                  showWhatsNewBadge ? (
                    <Badge size="xs" variant="filled">
                      {t('account.whatsNewBadge')}
                    </Badge>
                  ) : undefined
                }
                closeMenuOnClick
              >
                {t('account.whatsNew')}
              </Menu.Item>
              {me?.user?.isAdmin && (
                <Menu.Item
                  component={Link}
                  to="/admin/organisation/users"
                  leftSection={<IconShield size={14} />}
                  closeMenuOnClick
                >
                  {t('account.admin')}
                </Menu.Item>
              )}
              <Menu.Divider />
              <Menu.Item
                leftSection={<IconLogout size={14} />}
                onClick={() => logout.mutate()}
                disabled={logout.isPending}
                color="red"
                closeMenuOnClick
              >
                {t('account.logOut')}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>
    </div>
  );
}
