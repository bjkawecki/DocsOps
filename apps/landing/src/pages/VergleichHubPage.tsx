import { Anchor, Badge, Card, Group, Stack, Text, Title } from '@mantine/core';
import { Link } from 'react-router-dom';
import { LandingHead } from '../components/LandingHead';
import { ComparisonSection } from '../components/sections/ComparisonSection';
import { vergleichHubItems } from '../content/comparison';
import { vergleichHubCopy } from '../content/siteCopy';

export function VergleichHubPage() {
  const upcoming = vergleichHubItems.filter((item) => !item.ready);

  return (
    <Stack gap="xl" py="md">
      <LandingHead
        title={`${vergleichHubCopy.title} – DocsOps`}
        description={vergleichHubCopy.metaDescription}
        path="/vergleich"
      />
      <Stack gap="sm" maw={760}>
        <Title order={1}>{vergleichHubCopy.title}</Title>
        {vergleichHubCopy.intro.map((paragraph, index) => (
          <Text key={index} c="dimmed" size="lg">
            {paragraph}
          </Text>
        ))}
      </Stack>

      <ComparisonSection showTitle={false} />

      <Stack gap="md" maw={760}>
        <Title order={2}>{vergleichHubCopy.whyTitle}</Title>
        {vergleichHubCopy.whyPoints.map((point) => (
          <Stack key={point.title} gap={4}>
            <Text fw={600}>{point.title}</Text>
            <Text c="dimmed" size="sm">
              {point.body}
            </Text>
          </Stack>
        ))}
      </Stack>

      {upcoming.length > 0 ? (
        <Stack gap="md">
          <Title order={2}>{vergleichHubCopy.moreTitle}</Title>
          <Text c="dimmed" size="sm" maw={640}>
            {vergleichHubCopy.moreIntro}
          </Text>
          {upcoming.map((item) => (
            <Card key={item.slug} withBorder padding="lg" bg="dark.8">
              <Group justify="space-between" align="flex-start" wrap="nowrap">
                <Stack gap="xs" maw={640}>
                  <Group gap="sm">
                    <Text fw={600} fz="lg">
                      DocsOps vs. {item.name}
                    </Text>
                    <Badge variant="light" color="gray">
                      {vergleichHubCopy.comingSoon}
                    </Badge>
                  </Group>
                  <Text c="dimmed" size="sm">
                    {item.description}
                  </Text>
                </Stack>
              </Group>
            </Card>
          ))}
        </Stack>
      ) : null}

      <Text size="sm" c="dimmed">
        {vergleichHubCopy.backHint}{' '}
        <Anchor component={Link} to="/" c="blue.4" underline="always">
          {vergleichHubCopy.backLink}
        </Anchor>
      </Text>
    </Stack>
  );
}
