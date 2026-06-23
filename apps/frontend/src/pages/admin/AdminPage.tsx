import { Link, Outlet, useLocation } from 'react-router-dom';
import { Badge, Group, Tabs, Text, Title } from '@mantine/core';
import { useAdminUpdateStatus } from '../../hooks/useAdminUpdateStatus.js';
import './AdminPage.css';

const adminTabs = [
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/teams', label: 'Teams' },
  { to: '/admin/departments', label: 'Departments' },
  { to: '/admin/company', label: 'Company' },
  { to: '/admin/jobs', label: 'Jobs' },
  { to: '/admin/scheduler', label: 'Scheduler' },
  { to: '/admin/backup', label: 'Backup' },
  { to: '/admin/migration', label: 'Migration' },
  { to: '/admin/broadcast', label: 'Broadcast' },
  { to: '/admin/system', label: 'System' },
] as const;

export function AdminPage() {
  const location = useLocation();
  const { data: updateStatus } = useAdminUpdateStatus();
  const activeTab =
    adminTabs.find((t) => location.pathname === t.to || location.pathname.startsWith(t.to + '/'))
      ?.to ?? '/admin/users';

  return (
    <>
      <Title order={2} mb={4}>
        Admin
      </Title>
      <Text size="sm" c="dimmed" mb="md">
        Manage users, teams, departments, and company.
      </Text>
      <Tabs value={activeTab}>
        <Tabs.List mb="md">
          {adminTabs.map((t) => (
            <Tabs.Tab key={t.to} value={t.to} renderRoot={(props) => <Link to={t.to} {...props} />}>
              {t.to === '/admin/system' && updateStatus?.updateAvailable ? (
                <Group gap={6} wrap="nowrap">
                  {t.label}
                  <Badge size="xs" color="orange" variant="filled">
                    Update
                  </Badge>
                </Group>
              ) : (
                t.label
              )}
            </Tabs.Tab>
          ))}
        </Tabs.List>
        <Outlet />
      </Tabs>
    </>
  );
}
