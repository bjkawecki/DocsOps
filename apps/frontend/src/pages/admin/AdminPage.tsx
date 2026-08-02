import { Outlet, useLocation } from 'react-router-dom';
import { Box, Container, Flex, Paper } from '@mantine/core';
import { IconSettings } from '@tabler/icons-react';
import { useMemo } from 'react';
import {
  useSetAppShellBreadcrumbs,
  useSetAppShellChromeBar,
  type AppShellBreadcrumbItem,
} from '../../components/appShell/AppShellBreadcrumbsContext.js';
import { useSetAppShellNavScope } from '../../components/appShell/AppShellNavScopeContext.js';
import { ContextWorkspaceLeftColumn } from '../contextWorkspace/contextWorkspaceChrome.js';
import { AdminContentSidebar } from './AdminContentSidebar.js';
import { ADMIN_DEFAULT_PATH, findAdminNavItem } from './adminNavConfig.js';
import './AdminPage.css';

export function AdminPage() {
  const location = useLocation();
  const currentItem = findAdminNavItem(location.pathname);

  const breadcrumbs = useMemo((): AppShellBreadcrumbItem[] => {
    const items: AppShellBreadcrumbItem[] = [
      {
        key: 'admin',
        label: 'Admin',
        to: ADMIN_DEFAULT_PATH,
        icon: <IconSettings size={14} stroke={1.5} />,
      },
    ];
    if (currentItem != null) {
      items.push({
        key: currentItem.to,
        label: currentItem.label,
      });
    }
    return items;
  }, [currentItem]);

  useSetAppShellBreadcrumbs(breadcrumbs);
  useSetAppShellChromeBar(null);
  useSetAppShellNavScope(null);

  return (
    <Container fluid maw={1600} px="md" mb="xl">
      <Paper withBorder={false} p={0} radius="md">
        <Flex direction={{ base: 'column', lg: 'row' }} gap="md" align="flex-start">
          <ContextWorkspaceLeftColumn data-context-sibling-nav>
            <AdminContentSidebar />
          </ContextWorkspaceLeftColumn>

          <Box style={{ flex: 1, minWidth: 0, width: '100%' }} className="admin-page-content">
            <Outlet />
          </Box>
        </Flex>
      </Paper>
    </Container>
  );
}
