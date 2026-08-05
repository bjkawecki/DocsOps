import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Anchor } from '@mantine/core';

type LandingNavLinkProps = {
  to: string;
  children: ReactNode;
  onClick?: () => void;
};

export function LandingNavLink({ to, children, onClick }: LandingNavLinkProps) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Anchor
      component={Link}
      to={to}
      onClick={onClick}
      className={`landing-nav-link${isActive ? ' landing-nav-link--active' : ''}`}
      aria-current={isActive ? 'page' : undefined}
      underline="never"
    >
      {children}
    </Anchor>
  );
}

type LandingNavAnchorProps = {
  href: string;
  children: ReactNode;
  onClick?: () => void;
  active?: boolean;
};

export function LandingNavAnchor({
  href,
  children,
  onClick,
  active = false,
}: LandingNavAnchorProps) {
  return (
    <Anchor
      href={href}
      onClick={onClick}
      className={`landing-nav-link${active ? ' landing-nav-link--active' : ''}`}
      aria-current={active ? 'page' : undefined}
      underline="never"
    >
      {children}
    </Anchor>
  );
}
