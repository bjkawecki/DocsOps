import { Link, Outlet, useLocation } from 'react-router-dom';
import { Tabs, Text, Title } from '@mantine/core';
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
  const activeTab =
    adminTabs.find((t) => location.pathname === t.to || location.pathname.startsWith(t.to + '/'))
      ?.to ?? '/admin/users';

  return (
    <>
      <Title order={2} fw={600} mb={4} style={{ fontSize: '1.25rem' }}>
        Admin
      </Title>
      <Text size="sm" c="dimmed" mb="sm">
        Manage users, teams, departments, and company.
      </Text>
      <Tabs
        value={activeTab}
        styles={{
          tab: {
            textTransform: 'uppercase',
            fontWeight: 500,
            fontSize: 'var(--mantine-font-size-xs)',
            paddingTop: 6,
            paddingBottom: 6,
          },
        }}
      >
        <Tabs.List mb="sm">
          {adminTabs.map((t) => (
            <Tabs.Tab key={t.to} value={t.to} renderRoot={(props) => <Link to={t.to} {...props} />}>
              {t.label}
            </Tabs.Tab>
          ))}
        </Tabs.List>
        <Outlet />
      </Tabs>
    </>
  );
}
