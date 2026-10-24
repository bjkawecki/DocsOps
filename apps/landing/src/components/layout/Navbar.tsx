import {
  Anchor,
  Box,
  Burger,
  Container,
  Drawer,
  Group,
  Image,
  Menu,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconChevronDown } from '@tabler/icons-react';
import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getDemoUrl, resolveProjectNavHref } from '../../config/env';
import {
  modellNavLinks,
  navbarCopy,
  philosophieNavLinks,
  projectNavLinks,
} from '../../content/siteCopy';
import { LandingExternalButton, LandingExternalLink } from '../LandingExternalLink';
import { LandingNavAnchor, LandingNavLink } from '../LandingNavLink';

const navbarProjectLinks = projectNavLinks;

type NavMenuTriggerProps = {
  label: string;
  active: boolean;
  menuLabel: string;
} & ComponentPropsWithoutRef<'button'>;

const NavMenuTrigger = forwardRef<HTMLButtonElement, NavMenuTriggerProps>(function NavMenuTrigger(
  { label, active, menuLabel, className, ...others },
  ref
) {
  return (
    <UnstyledButton
      ref={ref}
      type="button"
      className={[
        'landing-nav-link',
        'landing-nav-link--menu',
        active ? 'landing-nav-link--active' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-haspopup="menu"
      aria-label={menuLabel}
      {...others}
    >
      <Group gap={4} wrap="nowrap" align="center">
        <span>{label}</span>
        <IconChevronDown className="landing-nav-chevron" size={14} stroke={2} aria-hidden />
      </Group>
    </UnstyledButton>
  );
});

export function Navbar() {
  const demoUrl = getDemoUrl();
  const location = useLocation();
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false);
  const isHome = location.pathname === '/';
  const philosophieActive =
    location.pathname === '/philosophie' || location.pathname === '/vergleich';

  return (
    <>
      <Box component="header" className="landing-navbar">
        <Container size="lg">
          <Group justify="space-between" wrap="nowrap">
            <Group gap="sm" wrap="nowrap">
              <Burger
                opened={drawerOpened}
                onClick={toggleDrawer}
                hiddenFrom="sm"
                aria-label="Menü"
              />
              <Anchor component={Link} to="/" underline="never" c="white" onClick={closeDrawer}>
                <Group gap="sm" wrap="nowrap">
                  <Image src="/docops-dark.svg" alt="" w={36} h={36} fit="contain" />
                  <Box component="span" fw={700} fz="xl">
                    DocsOps
                  </Box>
                </Group>
              </Anchor>
            </Group>

            <Group gap="lg" visibleFrom="sm" wrap="nowrap">
              <Menu trigger="hover" openDelay={80} closeDelay={120} withinPortal>
                <Menu.Target>
                  <NavMenuTrigger
                    label={navbarCopy.modell}
                    active={isHome}
                    menuLabel={`${navbarCopy.modell} öffnen`}
                  />
                </Menu.Target>
                <Menu.Dropdown>
                  {modellNavLinks.map((link) => (
                    <Menu.Item key={link.href} component="a" href={link.href}>
                      {link.label}
                    </Menu.Item>
                  ))}
                </Menu.Dropdown>
              </Menu>

              <Menu trigger="hover" openDelay={80} closeDelay={120} withinPortal>
                <Menu.Target>
                  <NavMenuTrigger
                    label={navbarCopy.philosophie}
                    active={philosophieActive}
                    menuLabel={`${navbarCopy.philosophie} öffnen`}
                  />
                </Menu.Target>
                <Menu.Dropdown>
                  {philosophieNavLinks.map((link) => (
                    <Menu.Item key={link.href} component={Link} to={link.href}>
                      {link.label}
                    </Menu.Item>
                  ))}
                </Menu.Dropdown>
              </Menu>

              {navbarProjectLinks.map((link) => {
                const resolved = resolveProjectNavHref(link.href);
                if (resolved.external) {
                  return (
                    <LandingExternalLink
                      key={link.label}
                      href={resolved.url}
                      className="landing-nav-link landing-nav-link--external"
                      underline="never"
                    >
                      {link.label}
                    </LandingExternalLink>
                  );
                }
                return (
                  <LandingNavLink key={link.label} to={resolved.url}>
                    {link.label}
                  </LandingNavLink>
                );
              })}
            </Group>

            <LandingExternalButton href={demoUrl}>{navbarCopy.demoCta}</LandingExternalButton>
          </Group>
        </Container>
      </Box>

      <Drawer
        opened={drawerOpened}
        onClose={closeDrawer}
        title="Navigation"
        hiddenFrom="sm"
        size="xs"
      >
        <Stack gap="md">
          <Text fw={600} size="sm" c="gray.5" tt="uppercase">
            {navbarCopy.modell}
          </Text>
          {modellNavLinks.map((link) => (
            <LandingNavAnchor key={link.href} href={link.href} onClick={closeDrawer}>
              {link.label}
            </LandingNavAnchor>
          ))}
          <Text fw={600} size="sm" c="gray.5" tt="uppercase" mt="xs">
            {navbarCopy.philosophie}
          </Text>
          {philosophieNavLinks.map((link) => (
            <LandingNavLink key={link.href} to={link.href} onClick={closeDrawer}>
              {link.label}
            </LandingNavLink>
          ))}
          {navbarProjectLinks.map((link) => {
            const resolved = resolveProjectNavHref(link.href);
            if (resolved.external) {
              return (
                <LandingExternalLink
                  key={link.label}
                  href={resolved.url}
                  className="landing-nav-link landing-nav-link--external"
                  underline="never"
                  onClick={closeDrawer}
                >
                  {link.label}
                </LandingExternalLink>
              );
            }
            return (
              <LandingNavLink key={link.label} to={resolved.url} onClick={closeDrawer}>
                {link.label}
              </LandingNavLink>
            );
          })}
          <LandingExternalButton href={demoUrl} fullWidth mt="sm">
            {navbarCopy.demoCta}
          </LandingExternalButton>
        </Stack>
      </Drawer>
    </>
  );
}
