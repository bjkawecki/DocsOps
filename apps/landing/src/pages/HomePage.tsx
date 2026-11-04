import { Stack } from '@mantine/core';
import { useLocation } from 'react-router-dom';
import { LandingHead } from '../components/LandingHead';
import { LandingJsonLd } from '../components/LandingJsonLd';
import { ContextSection } from '../components/sections/ContextSection';
import { ExampleSection } from '../components/sections/ExampleSection';
import { FaqSection } from '../components/sections/FaqSection';
import { FeaturesSection } from '../components/sections/FeaturesSection';
import { FinalCtaSection } from '../components/sections/FinalCtaSection';
import { HeroSection } from '../components/sections/HeroSection';
import { PhilosophyTeaserSection } from '../components/sections/PhilosophyTeaserSection';
import { RolesPublicationSection } from '../components/sections/RolesPublicationSection';
import { ScopeSection } from '../components/sections/ScopeSection';
import { getGithubRepoUrl, getSiteUrl } from '../config/env';
import { useLandingCopy } from '../content/useLandingCopy';

function homeJsonLd(
  heroMetaDescription: string,
  faqItems: { question: string; answer: string }[],
  homeUrl: string
): Record<string, unknown>[] {
  const siteUrl = getSiteUrl();
  const githubUrl = getGithubRepoUrl();
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'DocsOps',
      url: homeUrl,
      logo: `${siteUrl}/docops.svg`,
      sameAs: [githubUrl],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'DocsOps',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Linux',
      url: homeUrl,
      description: heroMetaDescription,
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
  const location = useLocation();
  const { site, faq } = useLandingCopy();
  const { heroCopy } = site;
  const siteUrl = getSiteUrl();
  const homeUrl =
    location.pathname === '/en' || location.pathname.startsWith('/en/')
      ? `${siteUrl}/en`
      : `${siteUrl}/`;

  return (
    <Stack gap={0}>
      <LandingHead
        title={heroCopy.pageTitle}
        description={heroCopy.metaDescription}
        path={location.pathname === '/en' ? '/en' : '/'}
      />
      <LandingJsonLd data={homeJsonLd(heroCopy.metaDescription, faq.faqItems, homeUrl)} />
      <HeroSection />
      <ScopeSection />
      <ContextSection />
      <RolesPublicationSection />
      <ExampleSection />
      <PhilosophyTeaserSection />
      <FeaturesSection />
      <FaqSection />
      <FinalCtaSection />
    </Stack>
  );
}
