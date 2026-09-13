import { Outlet, useLocation } from 'react-router-dom';
import { Box, Container, Paper } from '@mantine/core';
import { IconSettings } from '@tabler/icons-react';
import { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from '@mantine/hooks';
import {
  useSetAppShellBreadcrumbs,
  useSetAppShellChromeBar,
  type AppShellBreadcrumbItem,
} from '../../components/appShell/AppShellBreadcrumbsContext.js';
import { WIDE_MIN_WIDTH } from '../../components/appShell/appShellLayoutConstants.js';
import { useSetAppShellNavScope } from '../../components/appShell/AppShellNavScopeContext.js';
import { PageMobileActionsHost } from '../../components/ui/pageMobileNav.js';
import { ResponsiveContentNav } from '../../components/ui/ResponsiveContentNav.js';
import { AdminContentSidebar } from './AdminContentSidebar.js';
import { ADMIN_DEFAULT_PATH, findAdminNavItem, getAdminNavGroups } from './adminNavConfig.js';
import { usePublicConfig } from '../../hooks/usePublicConfig.js';
import './AdminPage.css';

export function AdminPage() {
  const { t } = useTranslation(['shell', 'admin']);
  const location = useLocation();
  const isWide = useMediaQuery(WIDE_MIN_WIDTH) ?? true;
  const compactNavOpenRef = useRef<(() => void) | null>(null);
  const { data: publicConfig } = usePublicConfig();
  const demoMode = publicConfig?.demoMode === true;
  const navGroups = useMemo(() => getAdminNavGroups(demoMode), [demoMode]);
  const currentItem = findAdminNavItem(location.pathname, navGroups);

  const breadcrumbs = useMemo((): AppShellBreadcrumbItem[] => {
    const items: AppShellBreadcrumbItem[] = [
      {
        key: 'admin',
        label: t('shell:breadcrumb.admin'),
        to: ADMIN_DEFAULT_PATH,
        icon: <IconSettings size={14} stroke={1.5} />,
      },
    ];
    if (currentItem != null) {
      items.push({
        key: currentItem.to,
        label: t(`admin:${currentItem.labelKey}`),
      });
    }
    return items;
  }, [currentItem, t]);

  useSetAppShellBreadcrumbs(breadcrumbs);
  useSetAppShellChromeBar(null);
  useSetAppShellNavScope(null);

  const sectionTitle = t('shell:breadcrumb.admin');

  return (
    <Container fluid maw={1600} px="md" mb="xl">
      <Paper withBorder={false} p={0} radius="md">
        <PageMobileActionsHost navTitle={sectionTitle} compactNavOpenRef={compactNavOpenRef}>
          <ResponsiveContentNav
            title={sectionTitle}
            nav={<AdminContentSidebar />}
            compactNavOpenRef={isWide ? undefined : compactNavOpenRef}
          >
            <Box style={{ flex: 1, minWidth: 0, width: '100%' }} className="admin-page-content">
              <Outlet />
            </Box>
          </ResponsiveContentNav>
        </PageMobileActionsHost>
      </Paper>
    </Container>
  );
}
