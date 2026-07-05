import { Anchor, List, Stack, Text } from '@mantine/core';
import { Link } from 'react-router-dom';
import { LandingExternalLink } from '../components/LandingExternalLink';
import { LandingHead } from '../components/LandingHead';
import { LandingPageLayout, LandingPageSection } from '../components/LandingPageLayout';
import { getSponsorGithubUrl } from '../config/env';
import { sponsorCopy } from '../content/siteCopy';

export function SponsorPage() {
  const sponsorGithubUrl = getSponsorGithubUrl();

  return (
    <>
      <LandingHead
        title={`${sponsorCopy.title} – DocsOps`}
        description={sponsorCopy.metaDescription}
      />
      <LandingPageLayout title={sponsorCopy.title} intro={sponsorCopy.intro}>
        <LandingPageSection title={sponsorCopy.linksTitle}>
          <Stack gap="md" align="center">
            <Text size="sm" c="gray.4" ta="center">
              {sponsorCopy.linksHint}
            </Text>
            <List spacing="sm" maw={480}>
              {sponsorGithubUrl ? (
                <List.Item>
                  <LandingExternalLink href={sponsorGithubUrl}>GitHub Sponsors</LandingExternalLink>
                </List.Item>
              ) : (
                <List.Item>
                  <Text c="dimmed" ta="center">
                    GitHub Sponsors – Link folgt (VITE_SPONSOR_GITHUB_URL).
                  </Text>
                </List.Item>
              )}
            </List>
          </Stack>
        </LandingPageSection>

        <Stack align="center" mt="lg">
          <Anchor component={Link} to="/" className="landing-footer-link" underline="always">
            {sponsorCopy.backLink}
          </Anchor>
        </Stack>
      </LandingPageLayout>
    </>
  );
}
