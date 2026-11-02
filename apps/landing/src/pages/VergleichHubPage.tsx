import { Stack, Text, Title } from '@mantine/core';
import { LandingHead } from '../components/LandingHead';
import { ComparisonSection } from '../components/sections/ComparisonSection';
import { vergleichHubCopy } from '../content/siteCopy';

export function VergleichHubPage() {
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
    </Stack>
  );
}
