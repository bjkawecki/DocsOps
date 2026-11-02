import { Alert, Loader } from '@mantine/core';
import { useAdminSystemSettings } from '../../hooks/useAdminUpdateStatus.js';
import { AdminSystemMailSection } from './AdminSystemTab/AdminSystemMailSection.js';

/**
 * Admin Platform → Mail: SMTP configuration and test email.
 */
export function AdminMailTab() {
  const settingsQuery = useAdminSystemSettings();

  if (settingsQuery.isError) {
    return (
      <Alert color="red" variant="filled">
        Could not load mail settings. Reload the page or try again later.
      </Alert>
    );
  }

  if (settingsQuery.isPending || !settingsQuery.data) {
    return <Loader size="sm" />;
  }

  return <AdminSystemMailSection settings={settingsQuery.data} />;
}
