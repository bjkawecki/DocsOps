import { Box, Group, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { IconCircleCheck, IconCircleX } from '@tabler/icons-react';
import { LandingHead } from '../components/LandingHead';
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
    <Stack component="ul" gap="sm" className="landing-philosophy-summary-list" role="list">
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
  return (
    <>
      <LandingHead
        title={`${philosophieCopy.pageHeadline} – DocsOps`}
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
            <Stack gap="xs" align="center">
              <Title order={2} className="landing-philosophy-section-title">
                {philosophieCopy.meansTitle}
                <PhilosophyAccentPeriod />
              </Title>
              <Text className="landing-philosophy-section-subtitle" ta="center">
                {philosophieCopy.meansSubtitle}
              </Text>
            </Stack>

            <Stack gap="lg">
              {philosophieCopy.meansItems.map((item) => (
                <Group
                  key={item.title}
                  align="flex-start"
                  wrap="nowrap"
                  gap="sm"
                  className="landing-philosophy-means-item"
                >
                  <IconCircleCheck
                    size={22}
                    stroke={1.75}
                    className="landing-philosophy-check"
                    aria-hidden
                  />
                  <Text className="landing-philosophy-body" lh={1.65}>
                    <Text span fw={600} className="landing-philosophy-means-label">
                      {item.title}
                    </Text>{' '}
                    {item.description}
                  </Text>
                </Group>
              ))}
            </Stack>
          </Stack>

          <Stack gap="lg" className="landing-philosophy-summary" w="100%">
            <Title order={2} className="landing-philosophy-section-title">
              {philosophieCopy.summaryTitle}
              <PhilosophyAccentPeriod />
            </Title>

            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl" verticalSpacing="lg">
              <Paper
                component="section"
                p="lg"
                withBorder
                bg="dark.8"
                className="landing-philosophy-summary-card landing-surface-card"
              >
                <Stack gap="md">
                  <Title order={3} className="landing-philosophy-summary-column-title">
                    {philosophieCopy.fitsForTitle}
                  </Title>
                  <SummaryList items={philosophieCopy.fitsFor} variant="fits" />
                </Stack>
              </Paper>

              <Paper
                component="section"
                p="lg"
                withBorder
                bg="dark.8"
                className="landing-philosophy-summary-card landing-philosophy-summary-card--muted landing-surface-card"
              >
                <Stack gap="md">
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
        </Stack>
      </Box>
    </>
  );
}
