import { Anchor, Badge, Card, Group, Stack, Text, Title } from '@mantine/core';
import { Link } from 'react-router-dom';
import { vergleichHubItems } from '../content/comparison';
import { vergleichHubCopy } from '../content/siteCopy';

export function VergleichHubPage() {
  return (
    <Stack gap="xl" py="md">
      <Stack gap="sm" maw={760}>
        <Title order={1}>{vergleichHubCopy.title}</Title>
        <Text c="dimmed" size="lg">
          {vergleichHubCopy.intro}
        </Text>
        <Anchor component={Link} to="/" underline="always">
          {vergleichHubCopy.backLink}
        </Anchor>
      </Stack>

      <Stack gap="md">
        {vergleichHubItems.map((item) => (
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
    </Stack>
  );
}
