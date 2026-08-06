import { ActionIcon, Text } from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DocopsLogo } from './DocopsLogo';
import { MAIN_NAV_ID } from './appShellLayoutConstants.js';

type Props = {
  isMiniRail: boolean;
  resolvedColorScheme: 'light' | 'dark';
  onNavigate: () => void;
  showMobileClose?: boolean;
  onCloseMobile?: () => void;
};

export function AppShellSidebarBrand({
  isMiniRail,
  resolvedColorScheme,
  onNavigate,
  showMobileClose = false,
  onCloseMobile,
}: Props) {
  const { t } = useTranslation('shell');

  if (isMiniRail) {
    return (
      <div className="app-shell-sidebar-brand app-shell-sidebar-brand--mini">
        <Link
          to="/"
          onClick={onNavigate}
          className="app-shell-sidebar-brand-home app-shell-sidebar-brand-home--mini"
          aria-label="DocsOps home"
        >
          <DocopsLogo width={22} height={22} />
        </Link>
      </div>
    );
  }

  return (
    <div className="app-shell-sidebar-brand">
      <Link
        to="/"
        onClick={onNavigate}
        className="app-shell-sidebar-brand-home app-shell-sidebar-brand-home--expanded"
        aria-label="DocsOps home"
      >
        <DocopsLogo width={24} height={24} />
        <Text component="span" style={{ lineHeight: 1 }}>
          <Text
            component="span"
            c={resolvedColorScheme === 'dark' ? 'white' : 'dimmed'}
            style={{ fontWeight: 600, fontSize: '0.9375rem', letterSpacing: '-0.02em' }}
          >
            Docs
          </Text>
          <Text
            component="span"
            c="var(--mantine-primary-color-filled)"
            style={{ fontWeight: 600, fontSize: '0.9375rem', letterSpacing: '-0.02em' }}
          >
            Ops
          </Text>
        </Text>
      </Link>
      {showMobileClose && onCloseMobile ? (
        <ActionIcon
          type="button"
          variant="subtle"
          size={44}
          className="app-shell-navbar-mobile-close"
          aria-label={t('nav.closeMenu')}
          aria-controls={MAIN_NAV_ID}
          onClick={onCloseMobile}
        >
          <IconX size={22} stroke={1.75} />
        </ActionIcon>
      ) : null}
    </div>
  );
}
