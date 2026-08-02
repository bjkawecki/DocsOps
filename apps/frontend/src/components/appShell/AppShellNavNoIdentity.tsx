import { useTranslation } from 'react-i18next';
import { IconBuildingSkyscraper, IconSitemap, IconUsersGroup } from '@tabler/icons-react';
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

export function AppShellNavNoIdentity({
  pathname,
  navLinkStyles,
  companyCount,
  isMiniRail = false,
  onNavigate,
}: Props) {
  const { t } = useTranslation('shell');
  const navScope = useAppShellNavScope();
  return (
    <>
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
      <AppShellScopeNavLink
        to="/department"
        label={t('nav.department')}
        active={isOrgNavActive('/department', pathname, navScope, { type: 'department' })}
        leftSection={<IconSitemap size={20} />}
        navLinkStyles={navLinkStyles}
        isMiniRail={isMiniRail}
        onNavigate={onNavigate}
      />
      <AppShellScopeNavLink
        to="/team"
        label={t('nav.team')}
        active={isOrgNavActive('/team', pathname, navScope, { type: 'team' })}
        leftSection={<IconUsersGroup size={20} />}
        navLinkStyles={navLinkStyles}
        isMiniRail={isMiniRail}
        onNavigate={onNavigate}
      />
    </>
  );
}
