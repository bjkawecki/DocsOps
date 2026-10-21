import { useTranslation } from 'react-i18next';
import { IconBuildingSkyscraper } from '@tabler/icons-react';
import { isOrgNavActive, type AppShellNavLinkStyles } from './appShellNavUtils.js';
import { useAppShellNavScope } from './AppShellNavScopeContext.js';
import { AppShellScopeNavLink } from './AppShellScopeNavLink';

type Props = {
  pathname: string;
  navLinkStyles: AppShellNavLinkStyles;
  companyCount: number | undefined;
  isMiniRail?: boolean;
  onNavigate?: () => void;
};

/** Shared company scope link used across org nav variants. */
export function AppShellNavCompanyLink({
  pathname,
  navLinkStyles,
  companyCount,
  isMiniRail = false,
  onNavigate,
}: Props) {
  const { t } = useTranslation('shell');
  const navScope = useAppShellNavScope();
  return (
    <AppShellScopeNavLink
      to="/company"
      label={t('nav.company')}
      active={isOrgNavActive('/company', pathname, navScope, { type: 'company' })}
      leftSection={<IconBuildingSkyscraper size={20} />}
      navLinkStyles={navLinkStyles}
      badgeCount={companyCount}
      isMiniRail={isMiniRail}
      onNavigate={onNavigate}
    />
  );
}
