import { Anchor, Box, Container, Group, Image, SimpleGrid, Stack, Text } from '@mantine/core';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LandingExternalLink } from '../LandingExternalLink';
import { getAppVersion, getDemoUrl, resolveProjectNavHref } from '../../config/env';
import { footerCopy, modellNavLinks, projectNavLinks } from '../../content/siteCopy';

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Anchor component={Link} to={href} className="landing-footer-link" underline="never">
      {children}
    </Anchor>
  );
}

function FooterAnchor({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Anchor href={href} className="landing-footer-link" underline="never">
      {children}
    </Anchor>
  );
}

export function Footer() {
  const demoUrl = getDemoUrl();
  const appVersion = getAppVersion();
  const year = new Date().getFullYear();

  return (
    <Box component="footer" className="landing-footer">
      <Container size="lg">
        <Stack gap="xl">
          <Group justify="center" gap="sm">
            <Image src="/docops-dark.svg" alt="" w={32} h={32} fit="contain" />
            <Text fw={700} fz="lg">
              DocsOps
            </Text>
          </Group>

          <SimpleGrid cols={{ base: 1, xs: 2, sm: 4 }} spacing="xl">
            <Stack gap="xs">
              <Text fw={600} className="landing-footer-heading">
                {footerCopy.productTitle}
              </Text>
              <FooterLink href="/philosophie">{footerCopy.links.philosophie}</FooterLink>
              <FooterLink href="/install">{footerCopy.links.installation}</FooterLink>
              <LandingExternalLink href={demoUrl} className="landing-footer-link" underline="never">
                {footerCopy.links.demo}
              </LandingExternalLink>
            </Stack>

            <Stack gap="xs">
              <Text fw={600} className="landing-footer-heading">
                {footerCopy.modellTitle}
              </Text>
              {modellNavLinks.map((link) => (
                <FooterAnchor key={link.href} href={link.href}>
                  {link.label}
                </FooterAnchor>
              ))}
            </Stack>

            <Stack gap="xs">
              <Text fw={600} className="landing-footer-heading">
                {footerCopy.projectTitle}
              </Text>
              {projectNavLinks.map((link) => {
                const resolved = resolveProjectNavHref(link.href);
                if (resolved.external) {
                  return (
                    <LandingExternalLink
                      key={link.label}
                      href={resolved.url}
                      className="landing-footer-link"
                      underline="never"
                    >
                      {link.label}
                    </LandingExternalLink>
                  );
                }
                return (
                  <FooterLink key={link.label} href={resolved.url}>
                    {link.label}
                  </FooterLink>
                );
              })}
            </Stack>

            <Stack gap="xs">
              <Text fw={600} className="landing-footer-heading">
                {footerCopy.legalTitle}
              </Text>
              <FooterLink href="/impressum">{footerCopy.links.impressum}</FooterLink>
              <FooterLink href="/datenschutz">{footerCopy.links.datenschutz}</FooterLink>
            </Stack>
          </SimpleGrid>

          <Group justify="center" gap="md" className="landing-footer-meta">
            <Text size="sm" c="gray.5">
              {footerCopy.meta(year)}
            </Text>
            <Anchor
              component={Link}
              to="/changelog"
              size="sm"
              className="landing-footer-link"
              underline="never"
            >
              v{appVersion}
            </Anchor>
          </Group>
        </Stack>
      </Container>
    </Box>
  );
}
