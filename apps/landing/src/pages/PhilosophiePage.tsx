import { Button, Group, Paper, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { IconExternalLink, IconPlayerPlay, IconServer } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { LandingExternalButton } from '../components/LandingExternalLink';
import { LandingHead } from '../components/LandingHead';
import { LandingPageLayout, LandingPageSection } from '../components/LandingPageLayout';
import { getDemoUrl } from '../config/env';
import { philosophiePrinciples } from '../content/features';
import { philosophieCopy } from '../content/siteCopy';

export function PhilosophiePage() {
  const demoUrl = getDemoUrl();

  return (
    <>
      <LandingHead
        title={`${philosophieCopy.title} – DocsOps`}
        description={philosophieCopy.metaDescription}
      />
      <LandingPageLayout title={philosophieCopy.title} intro={philosophieCopy.intro}>
        <Stack gap="xl">
          <LandingPageSection title={philosophieCopy.problemTitle}>
            <Stack gap="xs" maw={640} mx="auto">
              {philosophieCopy.problemItems.map((item) => (
                <Text key={item} c="gray.2" lh={1.65}>
                  • {item}
                </Text>
              ))}
            </Stack>
          </LandingPageSection>

          <LandingPageSection title={philosophieCopy.thesisTitle}>
            <Text ta="center" maw={640} mx="auto" lh={1.65}>
              {philosophieCopy.thesis}
            </Text>
          </LandingPageSection>

          <LandingPageSection title={philosophieCopy.abgrenzungTitle}>
            <Text ta="center" maw={640} mx="auto" lh={1.65}>
              {philosophieCopy.abgrenzung}
            </Text>
          </LandingPageSection>

          <LandingPageSection title={philosophieCopy.principlesTitle}>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
              {philosophiePrinciples.map((principle) => (
                <Paper key={principle.title} p="lg" withBorder bg="dark.8">
                  <Stack gap="sm">
                    <ThemeIcon size={40} radius="md" variant="light" color="blue">
                      <principle.icon size={22} stroke={1.6} />
                    </ThemeIcon>
                    <Text fw={600}>{principle.title}</Text>
                    <Text size="sm" c="dimmed">
                      {principle.description}
                    </Text>
                  </Stack>
                </Paper>
              ))}
            </SimpleGrid>
          </LandingPageSection>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
            <Paper p="lg" withBorder bg="dark.8">
              <Stack gap="sm" align="center">
                <Title order={3} className="landing-page-section-title">
                  {philosophieCopy.forWhomTitle}
                </Title>
                <Text c="dimmed" ta="center">
                  {philosophieCopy.forWhom}
                </Text>
              </Stack>
            </Paper>
            <Paper p="lg" withBorder bg="dark.8">
              <Stack gap="sm" align="center">
                <Title order={3} className="landing-page-section-title">
                  {philosophieCopy.notForWhomTitle}
                </Title>
                <Text c="dimmed" ta="center">
                  {philosophieCopy.notForWhom}
                </Text>
              </Stack>
            </Paper>
          </SimpleGrid>

          <Group justify="center" gap="md">
            <LandingExternalButton
              href={demoUrl}
              showIcon={false}
              leftSection={<IconPlayerPlay size={18} color="var(--mantine-color-blue-4)" />}
              rightSection={<IconExternalLink size={14} stroke={1.75} aria-hidden />}
            >
              {philosophieCopy.ctaDemo}
            </LandingExternalButton>
            <Button
              component={Link}
              to="/install"
              variant="default"
              leftSection={<IconServer size={18} />}
            >
              {philosophieCopy.ctaInstall}
            </Button>
          </Group>
        </Stack>
      </LandingPageLayout>
    </>
  );
}
