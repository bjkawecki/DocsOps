import { Alert, Code, ScrollArea } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { AdminSystemUpdateStatus } from 'backend/api-types';

type Props = {
  status: AdminSystemUpdateStatus;
};

export function AdminSystemStatusAlerts({ status }: Props) {
  const { t } = useTranslation('admin');

  if (status.activeUpdateRun?.status === 'failed') {
    return (
      <Alert color="red" variant="filled" title={t('system.statusAlerts.updateFailedTitle')}>
        <ScrollArea.Autosize mah={240}>
          <Code
            block
            c="red.0"
            bg="transparent"
            style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
          >
            {status.activeUpdateRun.errorMessage ?? t('system.statusAlerts.updateFailedFallback')}
          </Code>
        </ScrollArea.Autosize>
      </Alert>
    );
  }

  if (!status.updateCheckEnabled) {
    return null;
  }

  if (status.updateAvailable) {
    return (
      <Alert color="blue" variant="filled" title={t('system.statusAlerts.updateAvailableTitle')}>
        {t('system.statusAlerts.updateAvailableMessage')}
      </Alert>
    );
  }

  return null;
}
