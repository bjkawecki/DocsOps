import { useTranslation } from 'react-i18next';
import { IconSitemap, IconUsersGroup } from '@tabler/icons-react';
import { isOrgNavActive, type AppShellNavLinkStyles } from './appShellNavUtils.js';
import { useAppShellNavScope } from './AppShellNavScopeContext.js';
import { AppShellNavCompanyLink } from './AppShellNavCompanyLink.js';
import { AppShellScopeNavLink } from './AppShellScopeNavLink';

type Props = {
  pathname: string;
  navLinkStyles: AppShellNavLinkStyles;
  companyCount: number | undefined;
  isMiniRail?: boolean;
  onNavigate?: () => void;
  /** Platform admin / no membership: company link only. */
  companyOnly?: boolean;
};

export function AppShellNavNoIdentity({
  pathname,
  navLinkStyles,
  companyCount,
  isMiniRail = false,
  onNavigate,
  companyOnly = false,
}: Props) {
  const { t } = useTranslation('shell');
  const navScope = useAppShellNavScope();
  return (
    <>
      <AppShellNavCompanyLink
        pathname={pathname}
        navLinkStyles={navLinkStyles}
        companyCount={companyCount}
        isMiniRail={isMiniRail}
        onNavigate={onNavigate}
      />
      {!companyOnly ? (
        <>
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
      ) : null}
    </>
  );
}
