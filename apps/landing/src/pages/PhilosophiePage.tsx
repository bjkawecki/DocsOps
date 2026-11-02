import { Box, Stack, Text, Title } from '@mantine/core';
import { LandingHead } from '../components/LandingHead';
import { philosophieCopy } from '../content/siteCopy';

function PhilosophyAccentPeriod() {
  return (
    <Text span inherit className="landing-philosophy-accent">
      .
    </Text>
  );
}

export function PhilosophiePage() {
  return (
    <>
      <LandingHead
        title={`${philosophieCopy.pageHeadline} · DocsOps`}
        description={philosophieCopy.metaDescription}
      />
      <Box className="landing-page landing-philosophy-page">
        <Stack gap={56} align="center">
          <Stack gap="sm" align="center" className="landing-philosophy-hero">
            <Title order={1} className="landing-philosophy-headline">
              {philosophieCopy.pageHeadline}
              <PhilosophyAccentPeriod />
            </Title>
          </Stack>

          <Stack gap="lg" className="landing-philosophy-narrative" maw={640}>
            {philosophieCopy.intro.map((paragraph) => (
              <Text key={paragraph} className="landing-philosophy-body" lh={1.7}>
                {paragraph}
              </Text>
            ))}
          </Stack>

          <Stack gap={40} className="landing-philosophy-means" w="100%" maw={640}>
            {philosophieCopy.howCare.map((item) => (
              <Stack key={item.title} gap="md" className="landing-philosophy-means-item">
                <Title order={3} className="landing-philosophy-means-heading">
                  {item.title}
                </Title>
                {item.paragraphs.map((paragraph) => (
                  <Text key={paragraph} className="landing-philosophy-body" lh={1.7}>
                    {paragraph}
                  </Text>
                ))}
              </Stack>
            ))}
          </Stack>

          <Stack gap="lg" className="landing-philosophy-narrative" maw={640} w="100%">
            <Title order={2} className="landing-philosophy-section-title">
              {philosophieCopy.vision.title}
              <PhilosophyAccentPeriod />
            </Title>
            {philosophieCopy.vision.paragraphs.map((paragraph) => (
              <Text key={paragraph} className="landing-philosophy-body" lh={1.7}>
                {paragraph}
              </Text>
            ))}
          </Stack>
        </Stack>
      </Box>
    </>
  );
}
