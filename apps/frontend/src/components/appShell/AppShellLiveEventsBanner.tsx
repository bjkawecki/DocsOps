import { useTranslation } from 'react-i18next';
import type { LiveEventsStatus } from '../../hooks/liveEventsContext.js';
import { AppShellStatusBannerBar } from './AppShellStatusBannerBar.js';

type Props = {
  status: LiveEventsStatus;
  onRetry: () => void;
};

export function AppShellLiveEventsBanner({ status, onRetry }: Props) {
  const { t } = useTranslation('shell');

  if (status === 'connected') return null;

  if (status === 'reconnecting') {
    return <AppShellStatusBannerBar bg="yellow.7" message={t('liveEvents.reconnecting')} loader />;
  }

  return (
    <AppShellStatusBannerBar
      bg="red.8"
      message={t('liveEvents.disconnected')}
      action={{ label: t('liveEvents.retryNow'), onClick: onRetry, color: 'red' }}
    />
  );
}
