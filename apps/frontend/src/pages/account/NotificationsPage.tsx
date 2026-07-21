import {
  Box,
  Button,
  Container,
  Flex,
  Group,
  NavLink,
  Paper,
  Stack,
  Switch,
  Text,
  Tooltip,
} from '@mantine/core';
import { IconBell } from '@tabler/icons-react';
import { useCallback, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
  const { data: me } = useMe();
  const isAdmin = me?.user.isAdmin === true;
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
      label: 'Notifications',
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

  const totalLabel =
    listTotal == null ? null : `${listTotal} notification${listTotal !== 1 ? 's' : ''}`;

  const breadcrumbActions = useMemo(
    () => (
      <Group gap="md" wrap="nowrap" align="center">
        {totalLabel != null ? (
          <Text size="sm" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
            {totalLabel}
          </Text>
        ) : null}
        <Switch
          size="sm"
          label="Unread only"
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
          Mark all as read
        </Button>
      </Group>
    ),
    // mutate identity is stable; syncKey below drives shell refresh
    // eslint-disable-next-line react-hooks/exhaustive-deps -- unreadOnly + canMarkAll + pending + total
    [
      totalLabel,
      unreadOnly,
      canMarkAll,
      markAllAsRead.isPending,
      markAllAsRead.mutate,
      handleUnreadOnlyChange,
    ]
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

  return (
    <Container fluid maw={1600} px="md" mb="xl">
      <Paper withBorder={false} p={0} radius="md">
        <Flex direction={{ base: 'column', lg: 'row' }} gap="md" align="flex-start">
          <ContextWorkspaceLeftColumn data-context-sibling-nav>
            <ContentCardWrapper fullHeight={false}>
              <SectionLabel mb="sm">Type</SectionLabel>
              <Stack
                component="nav"
                gap={2}
                align="stretch"
                w="100%"
                aria-label="Notification categories"
              >
                {visibleCategories.map((item) => {
                  const link = (
                    <NavLink
                      component={Link}
                      to={categoryHref(item.value)}
                      replace
                      label={item.label}
                      leftSection={
                        <NotificationCategoryIcon category={item.value} size={ICON_SIZE} />
                      }
                      active={category === item.value}
                      aria-current={category === item.value ? 'page' : undefined}
                      variant="subtle"
                      style={navLinkFullWidth}
                    />
                  );
                  if (item.description == null) {
                    return (
                      <Box key={item.value} w="100%">
                        {link}
                      </Box>
                    );
                  }
                  return (
                    <Tooltip
                      key={item.value}
                      label={item.description}
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

          <Box style={{ flex: 1, minWidth: 0, width: '100%' }}>
            <NotificationsInboxPanel
              category={category}
              unreadOnly={unreadOnly}
              onCanMarkAllChange={handleCanMarkAllChange}
              onTotalChange={handleTotalChange}
            />
          </Box>
        </Flex>
      </Paper>
    </Container>
  );
}
