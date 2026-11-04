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
  useComputedColorScheme,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconChevronDown } from '@tabler/icons-react';
import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getDemoUrl, resolveProjectNavHref } from '../../config/env';
import { useLandingCopy } from '../../content/useLandingCopy';
import { useLocale } from '../../i18n/LocaleProvider';
import { localizePath, pathFor, stripLocalePrefix } from '../../i18n/locale';
import { LandingExternalButton, LandingExternalLink } from '../LandingExternalLink';
import { LandingNavAnchor, LandingNavLink } from '../LandingNavLink';
import { PageSettingsMenu } from './PageSettingsMenu';

function navMenuClassName(active: boolean, className?: string) {
  return [
    'landing-nav-link',
    'landing-nav-link--menu',
    active ? 'landing-nav-link--active' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
}

function NavMenuLabel({ label }: { label: string }) {
  return (
    <Group gap={4} wrap="nowrap" align="center">
      <span>{label}</span>
      <IconChevronDown className="landing-nav-chevron" size={14} stroke={2} aria-hidden />
    </Group>
  );
}

type NavMenuLinkTriggerProps = {
  label: string;
  active: boolean;
  href: string;
} & Omit<ComponentPropsWithoutRef<'a'>, 'href'>;

const NavMenuLinkTrigger = forwardRef<HTMLAnchorElement, NavMenuLinkTriggerProps>(
  function NavMenuLinkTrigger({ label, active, href, className, ...others }, ref) {
    return (
      <Anchor
        ref={ref}
        href={href}
        className={navMenuClassName(active, className)}
        aria-haspopup="menu"
        aria-current={active ? 'page' : undefined}
        underline="never"
        {...others}
      >
        <NavMenuLabel label={label} />
      </Anchor>
    );
  }
);

type NavMenuButtonTriggerProps = {
  label: string;
  active: boolean;
  menuLabel: string;
} & ComponentPropsWithoutRef<'button'>;

const NavMenuButtonTrigger = forwardRef<HTMLButtonElement, NavMenuButtonTriggerProps>(
  function NavMenuButtonTrigger({ label, active, menuLabel, className, ...others }, ref) {
    return (
      <UnstyledButton
        ref={ref}
        type="button"
        className={navMenuClassName(active, className)}
        aria-haspopup="menu"
        aria-label={menuLabel}
        {...others}
      >
        <NavMenuLabel label={label} />
      </UnstyledButton>
    );
  }
);

export function Navbar() {
  const demoUrl = getDemoUrl();
  const location = useLocation();
  const { locale } = useLocale();
  const { site } = useLandingCopy();
  const resolvedScheme = useComputedColorScheme('dark');
  const brandIcon = resolvedScheme === 'light' ? '/docops.svg' : '/docops-dark.svg';
  const { navbarCopy, modellNavLinks, philosophieNavLinks, projectNavLinks } = site;
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false);

  const barePath = stripLocalePrefix(location.pathname);
  const isHome = barePath === '/';
  const philosophieActive = barePath === '/philosophy' || barePath === '/compare';
  const homePath = pathFor(locale, 'home');
  const scopeHref = pathFor(locale, 'home', 'scope');

  return (
    <>
      <Box component="header" className="landing-navbar">
        <Container size="lg" className="landing-navbar-inner">
          <Group justify="space-between" wrap="nowrap">
            <Group gap="sm" wrap="nowrap">
              <Burger
                opened={drawerOpened}
                onClick={toggleDrawer}
                hiddenFrom="sm"
                aria-label="Menu"
              />
              <Anchor
                component={Link}
                to={homePath}
                underline="never"
                className="landing-brand-link"
                onClick={closeDrawer}
              >
                <Group gap="sm" wrap="nowrap">
                  <Image src={brandIcon} alt="" w={36} h={36} fit="contain" />
                  <Box component="span" fw={700} fz="xl">
                    DocsOps
                  </Box>
                </Group>
              </Anchor>
            </Group>

            <Group gap="lg" visibleFrom="sm" wrap="nowrap">
              <Menu
                trigger="hover"
                openDelay={80}
                closeDelay={120}
                withinPortal
                offset={6}
                classNames={{ dropdown: 'landing-nav-menu', item: 'landing-nav-menu-item' }}
              >
                <Menu.Target>
                  <NavMenuLinkTrigger label={navbarCopy.modell} active={isHome} href={scopeHref} />
                </Menu.Target>
                <Menu.Dropdown>
                  {modellNavLinks.map((link) => (
                    <Menu.Item key={link.href} component="a" href={localizePath(locale, link.href)}>
                      {link.label}
                    </Menu.Item>
                  ))}
                </Menu.Dropdown>
              </Menu>

              <Menu
                trigger="hover"
                openDelay={80}
                closeDelay={120}
                withinPortal
                offset={6}
                classNames={{ dropdown: 'landing-nav-menu', item: 'landing-nav-menu-item' }}
              >
                <Menu.Target>
                  <NavMenuButtonTrigger
                    label={navbarCopy.philosophie}
                    active={philosophieActive}
                    menuLabel={`${navbarCopy.philosophie} menu`}
                  />
                </Menu.Target>
                <Menu.Dropdown>
                  {philosophieNavLinks.map((link) => (
                    <Menu.Item
                      key={link.href}
                      component={Link}
                      to={localizePath(locale, link.href)}
                    >
                      {link.label}
                    </Menu.Item>
                  ))}
                </Menu.Dropdown>
              </Menu>

              {projectNavLinks.map((link) => {
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
                  <LandingNavLink key={link.label} to={localizePath(locale, resolved.url)}>
                    {link.label}
                  </LandingNavLink>
                );
              })}
            </Group>

            <span className="landing-navbar-cta-slot">
              <span className="landing-navbar-cta-sizer" aria-hidden>
                <LandingExternalButton href={demoUrl}>{navbarCopy.demoCta}</LandingExternalButton>
              </span>
              <LandingExternalButton href={demoUrl}>{navbarCopy.demoCta}</LandingExternalButton>
            </span>
          </Group>
        </Container>
        <div className="landing-settings-edge">
          <PageSettingsMenu />
        </div>
      </Box>

      <Drawer
        opened={drawerOpened}
        onClose={closeDrawer}
        title="Navigation"
        hiddenFrom="sm"
        size="xs"
      >
        <Stack gap="md">
          <Text fw={600} size="sm" c="dimmed" tt="uppercase">
            {navbarCopy.modell}
          </Text>
          {modellNavLinks.map((link) => (
            <LandingNavAnchor
              key={link.href}
              href={localizePath(locale, link.href)}
              onClick={closeDrawer}
            >
              {link.label}
            </LandingNavAnchor>
          ))}
          <Text fw={600} size="sm" c="dimmed" tt="uppercase" mt="xs">
            {navbarCopy.philosophie}
          </Text>
          {philosophieNavLinks.map((link) => (
            <LandingNavLink
              key={link.href}
              to={localizePath(locale, link.href)}
              onClick={closeDrawer}
            >
              {link.label}
            </LandingNavLink>
          ))}
          {projectNavLinks.map((link) => {
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
              <LandingNavLink
                key={link.label}
                to={localizePath(locale, resolved.url)}
                onClick={closeDrawer}
              >
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
