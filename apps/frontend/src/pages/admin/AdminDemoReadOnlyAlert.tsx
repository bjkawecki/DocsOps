import { Alert } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { usePublicConfig } from '../../hooks/usePublicConfig.js';

/** Shared demo read-only banner (coloured so it stays noticeable). */
export function AdminDemoReadOnlyAlert({
  messageKey = 'demo.limitedAdmin',
}: {
  messageKey?: string;
}) {
  const { t } = useTranslation('admin');
  const { data: publicConfig } = usePublicConfig();
  if (publicConfig?.demoMode !== true) return null;
  return (
    <Alert color="orange" variant="outline">
      {t(messageKey)}
    </Alert>
  );
}

export function useDemoMode(): boolean {
  const { data: publicConfig } = usePublicConfig();
  return publicConfig?.demoMode === true;
}
