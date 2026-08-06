import { AppShell as MantineAppShell, Stack, Box, Text, Divider } from '@mantine/core';
import {
  IconHome,
  IconListSearch,
  IconUser,
  IconShare,
  IconClipboardCheck,
  IconTemplate,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { AppShellRoleBasedNav } from './AppShellRoleBasedNav.js';
import { AppShellSidebarNavLink } from './AppShellSidebarNavLink.js';
import { AppShellSidebarBrand } from './AppShellSidebarBrand.js';
import { AppShellNavbarToolRow } from './AppShellNavbarToolRow.js';
import { AppShellSidebarCollapseControl } from './AppShellSidebarCollapseControl.js';
import { AppShellContinueReading } from './AppShellContinueReading.js';
import { AdminAppVersionLabel } from '../AdminAppVersionLabel.js';
import { isActive, isOrgNavActive } from './appShellNavUtils.js';
import { useAppShellNavScope } from './AppShellNavScopeContext.js';
import { MAIN_NAV_ID, SIDEBAR_MINI_GAP } from './appShellLayoutConstants.js';
import type { useAppShellSidebarData } from './useAppShellSidebarData.js';

type SidebarData = ReturnType<typeof useAppShellSidebarData>;

type Props = {
  s: SidebarData;
  isMiniRail: boolean;
  showDesktopToggle: boolean;
  onToggleDesktop: () => void;
  onNavigate: () => void;
  onOpenSearch: () => void;
  showMobileClose?: boolean;
  onCloseMobile?: () => void;
};

export function AppShellNavbar({
  s,
  isMiniRail,
  showDesktopToggle,
  onToggleDesktop,
  onNavigate,
  onOpenSearch,
  showMobileClose = false,
  onCloseMobile,
}: Props) {
  const { t } = useTranslation('shell');
  const navScope = useAppShellNavScope();
  return (
    <MantineAppShell.Navbar
      id={MAIN_NAV_ID}
      aria-label={t('nav.main')}
      p={0}
      className={`app-shell-navbar${isMiniRail ? ' app-shell-navbar--mini' : ''}`}
    >
      <Stack justify="space-between" style={{ height: '100%' }} gap={0}>
        <Box data-sidebar-nav style={{ minHeight: 0, overflow: 'auto' }}>
          <MantineAppShell.Section
            className={`app-shell-navbar-chrome${isMiniRail ? ' app-shell-navbar-chrome--mini' : ''}`}
          >
            <AppShellSidebarBrand
              isMiniRail={isMiniRail}
              resolvedColorScheme={s.resolvedColorScheme}
              onNavigate={onNavigate}
              showMobileClose={showMobileClose}
              onCloseMobile={onCloseMobile}
            />
          </MantineAppShell.Section>
          <MantineAppShell.Section
            className={`app-shell-navbar-body${isMiniRail ? ' app-shell-navbar-body--mini' : ''}`}
          >
            <AppShellNavbarToolRow isMiniRail={isMiniRail} onOpenSearch={onOpenSearch} />
            <Divider my={isMiniRail ? 'sm' : 10} />
            <Stack
              gap={isMiniRail ? SIDEBAR_MINI_GAP : 2}
              className={isMiniRail ? 'app-shell-mini-nav-stack' : undefined}
            >
              <AppShellSidebarNavLink
                to="/"
                label={t('nav.home')}
                active={isActive('/', s.location.pathname)}
                leftSection={<IconHome size={20} />}
                navLinkStyles={s.navLinkStyles}
                isMiniRail={isMiniRail}
                onNavigate={onNavigate}
              />
              <AppShellSidebarNavLink
                to="/catalog"
                label={t('nav.catalog')}
                active={isActive('/catalog', s.location.pathname)}
                leftSection={<IconListSearch size={20} />}
                navLinkStyles={s.navLinkStyles}
                isMiniRail={isMiniRail}
                badgeCount={s.catalogCount}
                onNavigate={onNavigate}
              />
              {s.canManageDocumentTemplates ? (
                <AppShellSidebarNavLink
                  to="/templates"
                  label={t('nav.templates')}
                  active={isActive('/templates', s.location.pathname)}
                  leftSection={<IconTemplate size={20} />}
                  navLinkStyles={s.navLinkStyles}
                  isMiniRail={isMiniRail}
                  onNavigate={onNavigate}
                />
              ) : null}
              {s.showOrganizationNav ? (
                <>
                  {!isMiniRail ? (
                    <Text size="sm" fw={600} c="dimmed" mt={14} mb={2}>
                      {t('nav.organization')}
                    </Text>
                  ) : null}
                  <AppShellRoleBasedNav
                    pathname={s.location.pathname}
                    navLinkStyles={s.navLinkStyles}
                    me={s.me}
                    isAdmin={s.isAdmin}
                    isCompanyLead={s.isCompanyLead}
                    isDepartmentLead={s.isDepartmentLead}
                    departmentId={s.departmentId}
                    userTeamId={s.userTeamId}
                    userDepartmentId={s.userDepartmentId}
                    companyDepartments={s.companyDepartments}
                    departmentTeams={s.departmentTeams}
                    companyCount={s.companyCount}
                    departmentCounts={s.departmentCounts}
                    teamCounts={s.teamCounts}
                    departmentsSectionExpanded={s.departmentsSectionExpanded}
                    setDepartmentsSectionExpanded={s.setDepartmentsSectionExpanded}
                    teamsSectionExpanded={s.teamsSectionExpanded}
                    setTeamsSectionExpanded={s.setTeamsSectionExpanded}
                    expandedDepartmentIds={s.expandedDepartmentIds}
                    setExpandedDepartmentIds={s.setExpandedDepartmentIds}
                    isMiniRail={isMiniRail}
                    onNavigate={onNavigate}
                  />
                </>
              ) : null}
              {!isMiniRail ? (
                <Text size="sm" fw={600} c="dimmed" mt={14} mb={2}>
                  {t('nav.personal')}
                </Text>
              ) : null}
              <AppShellSidebarNavLink
                to="/personal"
                label={t('nav.personal')}
                active={isOrgNavActive('/personal', s.location.pathname, navScope, {
                  type: 'personal',
                })}
                leftSection={<IconUser size={20} />}
                navLinkStyles={s.navLinkStyles}
                isMiniRail={isMiniRail}
                badgeCount={s.personalCount}
                onNavigate={onNavigate}
              />
              {s.showApprovalsNav ? (
                <AppShellSidebarNavLink
                  to="/approvals"
                  label={t('nav.approvals')}
                  title={t('nav.approvalsTitle')}
                  ariaLabel={t('nav.approvalsAria')}
                  active={
                    isActive('/approvals', s.location.pathname) ||
                    isActive('/reviews', s.location.pathname)
                  }
                  leftSection={<IconClipboardCheck size={20} />}
                  navLinkStyles={s.navLinkStyles}
                  isMiniRail={isMiniRail}
                  badgeCount={s.approvalsCount}
                  onNavigate={onNavigate}
                />
              ) : null}
              <AppShellSidebarNavLink
                to="/shared"
                label={t('nav.shared')}
                active={isOrgNavActive('/shared', s.location.pathname, navScope, {
                  type: 'shared',
                })}
                leftSection={<IconShare size={20} />}
                navLinkStyles={s.navLinkStyles}
                isMiniRail={isMiniRail}
                badgeCount={s.sharedCount}
                onNavigate={onNavigate}
              />
              <AppShellContinueReading isMiniRail={isMiniRail} onNavigate={onNavigate} />
            </Stack>
          </MantineAppShell.Section>
        </Box>
        <MantineAppShell.Section
          className={`app-shell-navbar-footer${isMiniRail ? ' app-shell-navbar-footer--mini' : ''}`}
        >
          <Stack gap={4} align={isMiniRail ? 'center' : 'stretch'}>
            <AdminAppVersionLabel
              isAdmin={s.me?.user?.isAdmin === true}
              isMiniRail={isMiniRail}
              ta={isMiniRail ? 'center' : 'left'}
              pl={isMiniRail ? 0 : 'xs'}
              fz={10}
              lh={1.2}
            />
            {showDesktopToggle ? (
              <>
                <Divider my={isMiniRail ? 4 : 6} />
                <AppShellSidebarCollapseControl
                  isMiniRail={isMiniRail}
                  onToggle={onToggleDesktop}
                />
              </>
            ) : null}
          </Stack>
        </MantineAppShell.Section>
      </Stack>
    </MantineAppShell.Navbar>
  );
}
