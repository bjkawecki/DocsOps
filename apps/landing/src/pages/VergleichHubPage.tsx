import { Stack, Text, Title } from '@mantine/core';
import { useLocation } from 'react-router-dom';
import { LandingHead } from '../components/LandingHead';
import { ComparisonSection } from '../components/sections/ComparisonSection';
import { useLandingCopy } from '../content/useLandingCopy';

export function VergleichHubPage() {
  const location = useLocation();
  const { site } = useLandingCopy();
  const { vergleichHubCopy } = site;

  return (
    <Stack gap="xl" py="md">
      <LandingHead
        title={`${vergleichHubCopy.title} – DocsOps`}
        description={vergleichHubCopy.metaDescription}
        path={location.pathname}
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
