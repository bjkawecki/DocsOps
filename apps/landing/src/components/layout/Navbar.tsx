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
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Link } from 'react-router-dom';
import { getDemoUrl, resolveProjectNavHref } from '../../config/env';
import { modellNavLinks, navbarCopy, projectNavLinks } from '../../content/siteCopy';
import { LandingExternalButton, LandingExternalLink } from '../LandingExternalLink';
import { LandingNavAnchor, LandingNavLink } from '../LandingNavLink';

const navbarProjectLinks = projectNavLinks;

export function Navbar() {
  const demoUrl = getDemoUrl();
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false);

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
                  <Anchor href="/#scope" className="landing-nav-link" underline="never">
                    {navbarCopy.modell}
                  </Anchor>
                </Menu.Target>
                <Menu.Dropdown>
                  {modellNavLinks.map((link) => (
                    <Menu.Item key={link.href} component="a" href={link.href}>
                      {link.label}
                    </Menu.Item>
                  ))}
                </Menu.Dropdown>
              </Menu>
              <LandingNavLink to="/philosophie">{navbarCopy.philosophie}</LandingNavLink>
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
          <LandingNavLink to="/philosophie" onClick={closeDrawer}>
            {navbarCopy.philosophie}
          </LandingNavLink>
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
