import { Button, Group, Paper, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { Link } from 'react-router-dom';
import { getDemoUrl } from '../config/env';
import { warumPrinciples } from '../content/features';
import { warumCopy } from '../content/siteCopy';

export function WarumPage() {
  const demoUrl = getDemoUrl();

  return (
    <Stack gap="xl" py="md">
      <Stack gap="sm" maw={760}>
        <Title order={1}>{warumCopy.title}</Title>
        <Text c="dimmed" size="lg">
          {warumCopy.intro}
        </Text>
      </Stack>

      <Stack gap="md">
        <Title order={2}>{warumCopy.problemTitle}</Title>
        <Stack gap="xs">
          {warumCopy.problemItems.map((item) => (
            <Text key={item}>• {item}</Text>
          ))}
        </Stack>
      </Stack>

      <Stack gap="md" maw={760}>
        <Title order={2}>{warumCopy.thesisTitle}</Title>
        <Text>{warumCopy.thesis}</Text>
      </Stack>

      <Stack gap="md">
        <Title order={2}>{warumCopy.principlesTitle}</Title>
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
          {warumPrinciples.map((principle) => (
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
      </Stack>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
        <Paper p="lg" withBorder bg="dark.8">
          <Stack gap="sm">
            <Title order={3}>{warumCopy.forWhomTitle}</Title>
            <Text c="dimmed">{warumCopy.forWhom}</Text>
          </Stack>
        </Paper>
        <Paper p="lg" withBorder bg="dark.8">
          <Stack gap="sm">
            <Title order={3}>{warumCopy.notForWhomTitle}</Title>
            <Text c="dimmed">{warumCopy.notForWhom}</Text>
          </Stack>
        </Paper>
      </SimpleGrid>

      <Group gap="md">
        <Button component="a" href={demoUrl} target="_blank" rel="noreferrer">
          {warumCopy.ctaDemo}
        </Button>
        <Button component={Link} to="/vergleich" variant="default">
          {warumCopy.ctaCompare}
        </Button>
      </Group>
    </Stack>
  );
}
