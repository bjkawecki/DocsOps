import { Box, Group, Text, Title } from '@mantine/core';
import { IconCircleCheck, IconStar } from '@tabler/icons-react';
import { LandingExternalButton } from '../components/LandingExternalLink';
import { LandingHead } from '../components/LandingHead';
import { getGithubRepoUrl, getSponsorGithubUrl } from '../config/env';
import { sponsorCopy } from '../content/siteCopy';

export function SponsorPage() {
  const sponsorUrl = getSponsorGithubUrl();
  const githubUrl = getGithubRepoUrl();

  return (
    <>
      <LandingHead
        title={`${sponsorCopy.title} · DocsOps`}
        description={sponsorCopy.metaDescription}
      />
      <Box className="landing-page landing-page--narrow landing-subpage">
        <header className="landing-subpage-hero">
          <Title order={1} className="landing-page-title">
            {sponsorCopy.title}
          </Title>
          <Text className="landing-subpage-intro">{sponsorCopy.intro}</Text>
        </header>

        <section className="landing-subpage-section" aria-labelledby="sponsor-why-heading">
          <Title order={2} id="sponsor-why-heading" className="landing-subpage-section-title">
            {sponsorCopy.whyTitle}
          </Title>
          <ul className="landing-subpage-list">
            {sponsorCopy.whyItems.map((item) => (
              <li key={item} className="landing-subpage-list-item">
                <IconCircleCheck
                  size={18}
                  stroke={1.75}
                  className="landing-subpage-list-icon"
                  aria-hidden
                />
                <Text component="span" className="landing-subpage-body">
                  {item}
                </Text>
              </li>
            ))}
          </ul>
        </section>

        <section className="landing-subpage-cta" aria-label={sponsorCopy.ctaStar}>
          <Text className="landing-subpage-cta-body">{sponsorCopy.ctaBody}</Text>
          <Group justify="center" gap="sm" className="landing-subpage-cta-actions">
            <LandingExternalButton
              href={githubUrl}
              className="landing-hero-cta-button"
              leftSection={
                <IconStar
                  size={18}
                  stroke={1.5}
                  fill="var(--mantine-color-yellow-4)"
                  color="var(--mantine-color-yellow-5)"
                  aria-hidden
                />
              }
              showIcon={false}
            >
              {sponsorCopy.ctaStar}
            </LandingExternalButton>
            {sponsorUrl ? (
              <LandingExternalButton
                href={sponsorUrl}
                variant="default"
                className="landing-hero-cta-button"
              >
                {sponsorCopy.ctaPrimary}
              </LandingExternalButton>
            ) : null}
          </Group>
        </section>
      </Box>
    </>
  );
}
