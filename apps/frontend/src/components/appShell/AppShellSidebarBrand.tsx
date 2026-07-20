import { Text } from '@mantine/core';
import { Link } from 'react-router-dom';
import { DocopsLogo } from './DocopsLogo';

type Props = {
  isMiniRail: boolean;
  resolvedColorScheme: 'light' | 'dark';
  onNavigate: () => void;
};

export function AppShellSidebarBrand({ isMiniRail, resolvedColorScheme, onNavigate }: Props) {
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
    </div>
  );
}
