import {
  Box,
  Button,
  Container,
  Flex,
  Group,
  NavLink,
  Paper,
  Select,
  Stack,
  Switch,
  Text,
  Tooltip,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconBell } from '@tabler/icons-react';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import { WIDE_MIN_WIDTH } from '../../components/appShell/appShellLayoutConstants.js';
import {
  useSetAppShellBreadcrumbActions,
  useSetAppShellBreadcrumbs,
} from '../../components/appShell/AppShellBreadcrumbsContext.js';
import { useSetAppShellNavScope } from '../../components/appShell/AppShellNavScopeContext.js';
import { ContentCardWrapper } from '../../components/contexts/cardShared.js';
import {
  NotificationsInboxPanel,
  parseMeNotificationCategory,
  parseMeNotificationUnreadOnly,
  type MeNotificationCategory,
} from '../../components/notifications/NotificationsInboxPanel';
import {
  categoryDescription,
  categoryLabel,
  NOTIFICATION_CATEGORY_NAV,
  NotificationCategoryIcon,
} from '../../components/notifications/notificationCategoryUi.js';
import { useMarkAllNotificationsAsRead } from '../../components/notifications/useMarkAllNotificationsAsRead.js';
import { SectionLabel } from '../../components/ui/SectionLabel.js';
import { useMe } from '../../hooks/useMe';
import { ContextWorkspaceLeftColumn } from '../contextWorkspace/contextWorkspaceChrome.js';

const ICON_SIZE = 16;

const navLinkFullWidth = {
  borderRadius: 'var(--mantine-radius-sm)',
  width: '100%',
} as const;

export function NotificationsPage() {
  const { t } = useTranslation('notifications');
  const { data: me } = useMe();
  const isAdmin = me?.user.isAdmin === true;
  const isWide = useMediaQuery(WIDE_MIN_WIDTH) ?? true;
  const [searchParams, setSearchParams] = useSearchParams();
  const [canMarkAll, setCanMarkAll] = useState(false);
  const [listTotal, setListTotal] = useState<number | null>(null);
  const markAllAsRead = useMarkAllNotificationsAsRead();

  const parsedCategory = parseMeNotificationCategory(searchParams.get('category'));
  const category = parsedCategory === 'operations' && !isAdmin ? 'announcements' : parsedCategory;
  const unreadOnly = parseMeNotificationUnreadOnly(searchParams.get('unreadOnly'));

  const visibleCategories = NOTIFICATION_CATEGORY_NAV.filter((item) => !item.adminOnly || isAdmin);

  useSetAppShellBreadcrumbs([
    {
      key: 'notifications',
      label: t('breadcrumb'),
      icon: <IconBell size={14} stroke={1.5} />,
    },
  ]);
  useSetAppShellNavScope(null);

  const handleUnreadOnlyChange = useCallback(
    (next: boolean) => {
      setSearchParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          if (next) p.set('unreadOnly', 'true');
          else p.delete('unreadOnly');
          return p;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const handleCategoryChange = useCallback(
    (next: string | null) => {
      if (next == null) return;
      setSearchParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          if (next === 'all') p.delete('category');
          else p.set('category', next);
          return p;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const totalLabel = listTotal == null ? null : t('page.total', { count: listTotal });

  const breadcrumbActions = (
    <Group gap="md" wrap="wrap" align="center">
      {totalLabel != null ? (
        <Text size="sm" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
          {totalLabel}
        </Text>
      ) : null}
      <Switch
        size="sm"
        label={t('page.unreadOnly')}
        checked={unreadOnly}
        onChange={(event) => {
          handleUnreadOnlyChange(event.currentTarget.checked);
        }}
      />
      <Button
        size="sm"
        variant="default"
        onClick={() => markAllAsRead.mutate()}
        disabled={markAllAsRead.isPending || !canMarkAll}
      >
        {t('page.markAllAsRead')}
      </Button>
    </Group>
  );

  useSetAppShellBreadcrumbActions(
    breadcrumbActions,
    `notif-actions:${unreadOnly}:${canMarkAll}:${markAllAsRead.isPending}:${listTotal ?? 'x'}`
  );

  const handleCanMarkAllChange = useCallback((next: boolean) => {
    setCanMarkAll(next);
  }, []);

  const handleTotalChange = useCallback((total: number | null) => {
    setListTotal(total);
  }, []);

  const categoryHref = (next: MeNotificationCategory) => {
    const p = new URLSearchParams(searchParams);
    if (next === 'all') p.delete('category');
    else p.set('category', next);
    const qs = p.toString();
    return qs.length > 0 ? `/notifications?${qs}` : '/notifications';
  };

  const inbox = (
    <NotificationsInboxPanel
      category={category}
      unreadOnly={unreadOnly}
      onCanMarkAllChange={handleCanMarkAllChange}
      onTotalChange={handleTotalChange}
    />
  );

  if (!isWide) {
    return (
      <Container fluid maw={1600} px="md" mb="xl">
        <Stack gap="md">
          <Select
            label={t('page.typeLabel')}
            aria-label={t('page.categoriesAriaLabel')}
            data={visibleCategories.map((item) => ({
              value: item.value,
              label: categoryLabel(t, item.value),
            }))}
            value={category}
            onChange={handleCategoryChange}
            allowDeselect={false}
          />
          {inbox}
        </Stack>
      </Container>
    );
  }

  return (
    <Container fluid maw={1600} px="md" mb="xl">
      <Paper withBorder={false} p={0} radius="md">
        <Flex direction="row" gap="md" align="flex-start">
          <ContextWorkspaceLeftColumn data-context-sibling-nav>
            <ContentCardWrapper fullHeight={false}>
              <SectionLabel mb="sm">{t('page.typeLabel')}</SectionLabel>
              <Stack
                component="nav"
                gap={2}
                align="stretch"
                w="100%"
                aria-label={t('page.categoriesAriaLabel')}
              >
                {visibleCategories.map((item) => {
                  const description = categoryDescription(t, item.value);
                  const link = (
                    <NavLink
                      component={Link}
                      to={categoryHref(item.value)}
                      replace
                      label={categoryLabel(t, item.value)}
                      leftSection={
                        <NotificationCategoryIcon category={item.value} size={ICON_SIZE} />
                      }
                      active={category === item.value}
                      aria-current={category === item.value ? 'page' : undefined}
                      variant="subtle"
                      style={navLinkFullWidth}
                    />
                  );
                  if (description == null) {
                    return (
                      <Box key={item.value} w="100%">
                        {link}
                      </Box>
                    );
                  }
                  return (
                    <Tooltip
                      key={item.value}
                      label={description}
                      position="right"
                      withArrow
                      openDelay={400}
                    >
                      <Box w="100%">{link}</Box>
                    </Tooltip>
                  );
                })}
              </Stack>
            </ContentCardWrapper>
          </ContextWorkspaceLeftColumn>

          <Box style={{ flex: 1, minWidth: 0, width: '100%' }}>{inbox}</Box>
        </Flex>
      </Paper>
    </Container>
  );
}
