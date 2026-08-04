import { Stack } from '@mantine/core';
import { LandingHead } from '../components/LandingHead';
import { LandingJsonLd } from '../components/LandingJsonLd';
import { ContextSection } from '../components/sections/ContextSection';
import { ExampleSection } from '../components/sections/ExampleSection';
import { FaqSection } from '../components/sections/FaqSection';
import { FinalCtaSection } from '../components/sections/FinalCtaSection';
import { HeroSection } from '../components/sections/HeroSection';
import { PhilosophyTeaserSection } from '../components/sections/PhilosophyTeaserSection';
import { RolesPublicationSection } from '../components/sections/RolesPublicationSection';
import { ScopeSection } from '../components/sections/ScopeSection';
import { getGithubRepoUrl, getSiteUrl } from '../config/env';
import { faqItems } from '../content/faq';
import { heroCopy } from '../content/siteCopy';

function homeJsonLd(): Record<string, unknown>[] {
  const siteUrl = getSiteUrl();
  const githubUrl = getGithubRepoUrl();
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'DocsOps',
      url: `${siteUrl}/`,
      logo: `${siteUrl}/docops.svg`,
      sameAs: [githubUrl],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'DocsOps',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Linux',
      url: `${siteUrl}/`,
      description: heroCopy.metaDescription,
      license: 'https://opensource.org/licenses/MIT',
      isAccessibleForFree: true,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'EUR',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqItems.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    },
  ];
}

export function HomePage() {
  return (
    <Stack gap={0}>
      <LandingHead title={heroCopy.pageTitle} description={heroCopy.metaDescription} path="/" />
      <LandingJsonLd data={homeJsonLd()} />
      <HeroSection />
      <ScopeSection />
      <ContextSection />
      <RolesPublicationSection />
      <ExampleSection />
      <PhilosophyTeaserSection />
      <FaqSection />
      <FinalCtaSection />
    </Stack>
  );
}
