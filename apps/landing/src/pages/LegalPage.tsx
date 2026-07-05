import { Stack, Text } from '@mantine/core';
import { LandingHead } from '../components/LandingHead';
import { LandingPageLayout, LandingPageSection } from '../components/LandingPageLayout';
import { legalCopy } from '../content/legalCopy';

type LegalPageProps = {
  kind: 'impressum' | 'datenschutz';
};

export function LegalPage({ kind }: LegalPageProps) {
  const content = kind === 'impressum' ? legalCopy.impressum : legalCopy.datenschutz;

  return (
    <>
      <LandingHead title={`${content.pageTitle} – DocsOps`} description={content.metaDescription} />
      <LandingPageLayout title={content.pageTitle} narrow>
        <Stack gap="xl">
          {content.sections.map((section) => (
            <LandingPageSection key={section.title} title={section.title} centered={false}>
              <Stack gap="xs">
                {section.paragraphs.map((paragraph) => (
                  <Text key={paragraph} c="gray.3" lh={1.65}>
                    {paragraph}
                  </Text>
                ))}
              </Stack>
            </LandingPageSection>
          ))}
        </Stack>
      </LandingPageLayout>
    </>
  );
}
