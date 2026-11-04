import { Anchor, Stack, Text } from '@mantine/core';
import { LandingHead } from '../components/LandingHead';
import { LandingPageLayout, LandingPageSection } from '../components/LandingPageLayout';
import { useLandingCopy } from '../content/useLandingCopy';

type LegalPageProps = {
  kind: 'impressum' | 'datenschutz';
};

function LegalParagraph({ text }: { text: string }) {
  const urlMatch = text.match(/^(.*?)(https?:\/\/\S+)(.*)$/);
  if (!urlMatch) {
    return (
      <Text c="dimmed" lh={1.65}>
        {text}
      </Text>
    );
  }
  const [, before, url, after] = urlMatch;
  return (
    <Text c="dimmed" lh={1.65}>
      {before}
      <Anchor href={url} target="_blank" rel="noreferrer noopener">
        {url.replace(/^https?:\/\//, '')}
      </Anchor>
      {after}
    </Text>
  );
}

export function LegalPage({ kind }: LegalPageProps) {
  const { legal } = useLandingCopy();
  const content = kind === 'impressum' ? legal.legalCopy.impressum : legal.legalCopy.datenschutz;

  return (
    <>
      <LandingHead title={`${content.pageTitle} – DocsOps`} description={content.metaDescription} />
      <LandingPageLayout title={content.pageTitle} narrow>
        <Stack gap="xl">
          {content.sections.map((section) => (
            <LandingPageSection key={section.title} title={section.title} centered={false}>
              <Stack gap="xs">
                {section.paragraphs.map((paragraph) => (
                  <LegalParagraph key={paragraph} text={paragraph} />
                ))}
              </Stack>
            </LandingPageSection>
          ))}
        </Stack>
      </LandingPageLayout>
    </>
  );
}
