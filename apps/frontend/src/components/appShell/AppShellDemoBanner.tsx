import { useTranslation } from 'react-i18next';
import { AppShellStatusBannerBar } from './AppShellStatusBannerBar.js';

type Props = {
  visible: boolean;
};

export function AppShellDemoBanner({ visible }: Props) {
  const { t } = useTranslation('shell');
  if (!visible) return null;
  return <AppShellStatusBannerBar bg="blue.8" message={t('demo.banner')} />;
}
