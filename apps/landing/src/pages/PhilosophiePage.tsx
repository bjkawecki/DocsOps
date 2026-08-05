import { Box, Button, Group, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { IconCircleCheck, IconCircleX, IconHeartHandshake } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { LandingExternalButton } from '../components/LandingExternalLink';
import { LandingHead } from '../components/LandingHead';
import { getDemoUrl } from '../config/env';
import { philosophieCopy } from '../content/siteCopy';

function PhilosophyAccentPeriod() {
  return (
    <Text span inherit className="landing-philosophy-accent">
      .
    </Text>
  );
}

function SummaryList({
  items,
  variant,
}: {
  items: readonly string[];
  variant: 'fits' | 'does-not-fit';
}) {
  const Icon = variant === 'fits' ? IconCircleCheck : IconCircleX;

  return (
    <Stack component="ul" gap="md" className="landing-philosophy-summary-list" role="list">
      {items.map((item) => (
        <Group
          key={item}
          component="li"
          align="flex-start"
          wrap="nowrap"
          gap="sm"
          className="landing-philosophy-summary-list-item"
        >
          <Icon
            size={20}
            stroke={1.75}
            className={
              variant === 'fits'
                ? 'landing-philosophy-summary-icon landing-philosophy-summary-icon--fits'
                : 'landing-philosophy-summary-icon landing-philosophy-summary-icon--muted'
            }
            aria-hidden
          />
          <Text
            className={
              variant === 'fits'
                ? 'landing-philosophy-body'
                : 'landing-philosophy-body landing-philosophy-body--muted'
            }
            lh={1.55}
          >
            {item}
          </Text>
        </Group>
      ))}
    </Stack>
  );
}

export function PhilosophiePage() {
  const demoUrl = getDemoUrl();

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
            <Text className="landing-philosophy-tagline" ta="center" maw={640}>
              {philosophieCopy.tagline}
            </Text>
          </Stack>

          <Stack gap="lg" className="landing-philosophy-narrative" maw={640}>
            {philosophieCopy.narrative.map((paragraph) => (
              <Text key={paragraph} className="landing-philosophy-body" lh={1.7}>
                {paragraph}
              </Text>
            ))}
          </Stack>

          <Stack gap="xl" className="landing-philosophy-means" w="100%" maw={640}>
            <Title order={2} className="landing-philosophy-section-title">
              {philosophieCopy.meansTitle}
              <PhilosophyAccentPeriod />
            </Title>

            <Stack gap={40}>
              {philosophieCopy.meansItems.map((item) => (
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
          </Stack>

          <Stack gap="lg" className="landing-philosophy-vision" maw={640} w="100%">
            <Title order={2} className="landing-philosophy-section-title">
              {philosophieCopy.visionTitle}
              <PhilosophyAccentPeriod />
            </Title>
            <Stack gap="lg">
              {philosophieCopy.vision.map((paragraph) => (
                <Text key={paragraph} className="landing-philosophy-body" lh={1.7}>
                  {paragraph}
                </Text>
              ))}
            </Stack>
          </Stack>

          <Stack gap={40} className="landing-philosophy-summary" w="100%">
            <Title
              order={2}
              className="landing-philosophy-section-title landing-philosophy-summary-title"
            >
              {philosophieCopy.summaryTitle}
              <PhilosophyAccentPeriod />
            </Title>

            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl" verticalSpacing="lg">
              <Paper
                component="section"
                p="xl"
                withBorder
                bg="dark.8"
                className="landing-philosophy-summary-card landing-surface-card"
              >
                <Stack gap="lg">
                  <Title order={3} className="landing-philosophy-summary-column-title">
                    {philosophieCopy.fitsForTitle}
                  </Title>
                  <SummaryList items={philosophieCopy.fitsFor} variant="fits" />
                </Stack>
              </Paper>

              <Paper
                component="section"
                p="xl"
                withBorder
                bg="dark.8"
                className="landing-philosophy-summary-card landing-philosophy-summary-card--muted landing-surface-card"
              >
                <Stack gap="lg">
                  <Title
                    order={3}
                    className="landing-philosophy-summary-column-title landing-philosophy-summary-column-title--muted"
                  >
                    {philosophieCopy.doesNotFitForTitle}
                  </Title>
                  <SummaryList items={philosophieCopy.doesNotFitFor} variant="does-not-fit" />
                </Stack>
              </Paper>
            </SimpleGrid>
          </Stack>

          <Stack gap="lg" align="center" maw={720} w="100%" className="landing-philosophy-cta">
            <Text ta="center" c="gray.2" lh={1.65}>
              {philosophieCopy.ctaBody}
            </Text>
            <Group justify="center" gap="md" w="100%">
              <LandingExternalButton href={demoUrl} className="landing-hero-cta-button">
                {philosophieCopy.primaryCta}
              </LandingExternalButton>
              <Button
                component={Link}
                to="/sponsor"
                variant="default"
                className="landing-hero-cta-button"
                leftSection={<IconHeartHandshake size={18} color="var(--mantine-color-blue-4)" />}
              >
                {philosophieCopy.secondaryCta}
              </Button>
            </Group>
          </Stack>
        </Stack>
      </Box>
    </>
  );
}
