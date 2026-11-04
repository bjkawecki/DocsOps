import {
  Anchor,
  Box,
  Container,
  Group,
  Image,
  SimpleGrid,
  Stack,
  Text,
  useComputedColorScheme,
} from '@mantine/core';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LandingExternalLink } from '../LandingExternalLink';
import { getAppVersion, getDemoUrl, resolveProjectNavHref } from '../../config/env';
import { useLandingCopy } from '../../content/useLandingCopy';
import { useLocale } from '../../i18n/LocaleProvider';
import { localizePath, pathFor } from '../../i18n/locale';

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
  const { locale } = useLocale();
  const { site } = useLandingCopy();
  const resolvedScheme = useComputedColorScheme('dark');
  const brandIcon = resolvedScheme === 'light' ? '/docops.svg' : '/docops-dark.svg';
  const { footerCopy, docsopsVsFooterLinks, projectNavLinks, authorSiteLink } = site;

  return (
    <Box component="footer" className="landing-footer">
      <Container size="lg">
        <Stack gap="xl">
          <SimpleGrid cols={{ base: 1, xs: 2, sm: 3, md: 5 }} spacing="xl">
            <Box className="landing-footer-brand-column">
              <Anchor
                component={Link}
                to={pathFor(locale, 'home')}
                underline="never"
                className="landing-footer-brand landing-brand-link"
              >
                <Group gap="sm" wrap="nowrap">
                  <Image src={brandIcon} alt="" w={32} h={32} fit="contain" />
                  <Text fw={700} fz="lg">
                    DocsOps
                  </Text>
                </Group>
              </Anchor>
            </Box>

            <Stack gap="xs">
              <Text fw={600} className="landing-footer-heading">
                {footerCopy.productTitle}
              </Text>
              <FooterAnchor href={pathFor(locale, 'home', 'scope')}>
                {footerCopy.links.howItWorks}
              </FooterAnchor>
              <FooterLink href={pathFor(locale, 'philosophy')}>
                {footerCopy.links.ourApproach}
              </FooterLink>
              <FooterLink href={pathFor(locale, 'install')}>
                {footerCopy.links.installation}
              </FooterLink>
              <LandingExternalLink href={demoUrl} className="landing-footer-link" underline="never">
                {footerCopy.links.demo}
              </LandingExternalLink>
            </Stack>

            <Stack gap="xs">
              <Text fw={600} className="landing-footer-heading">
                {footerCopy.docsopsVsTitle}
              </Text>
              {docsopsVsFooterLinks.map((link) => (
                <FooterLink key={link.href} href={localizePath(locale, link.href)}>
                  {link.label}
                </FooterLink>
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
                  <FooterLink key={link.label} href={localizePath(locale, resolved.url)}>
                    {link.label}
                  </FooterLink>
                );
              })}
              <LandingExternalLink
                href={authorSiteLink.href}
                className="landing-footer-link"
                underline="never"
              >
                {authorSiteLink.label}
              </LandingExternalLink>
            </Stack>

            <Stack gap="xs">
              <Text fw={600} className="landing-footer-heading">
                {footerCopy.legalTitle}
              </Text>
              <FooterLink href={pathFor(locale, 'legalImprint')}>
                {footerCopy.links.impressum}
              </FooterLink>
              <FooterLink href={pathFor(locale, 'legalPrivacy')}>
                {footerCopy.links.datenschutz}
              </FooterLink>
            </Stack>
          </SimpleGrid>

          <Group justify="center" gap="md" className="landing-footer-meta">
            <Text size="sm" c="dimmed">
              {footerCopy.meta(year)}
            </Text>
            <Anchor
              component={Link}
              to={pathFor(locale, 'changelog')}
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
