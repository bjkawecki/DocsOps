import { Alert, Loader } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useAdminSystemSettings } from '../../../hooks/useAdminUpdateStatus.js';
import { AdminHealthCheckSettings } from './AdminHealthCheckSettings.js';

/**
 * Admin Platform → Freshness: org default interval and auto-scan flag.
 */
export function AdminHealthCheckTab() {
  const { t } = useTranslation('admin');
  const settingsQuery = useAdminSystemSettings();

  if (settingsQuery.isError) {
    return (
      <Alert color="red" variant="filled">
        {t('healthCheck.loadError')}
      </Alert>
    );
  }

  if (settingsQuery.isPending || !settingsQuery.data) {
    return <Loader size="sm" />;
  }

  return <AdminHealthCheckSettings settings={settingsQuery.data} />;
}
