import { Stack, Text, Title } from '@mantine/core';

export function HelpOverviewPage() {
  return (
    <Stack gap="md" align="stretch" style={{ textAlign: 'left' }}>
      <Title order={2}>What is DocsOps?</Title>
      <Text size="md">
        DocsOps is a documentation and knowledge workspace for engineering organisations. You work
        in scoped areas (company, department, team, or personal space), create documents in
        processes or projects, and move work through review and publication when your organisation
        uses that workflow.
      </Text>
      <Text size="md" c="dimmed" fs="italic">
        DocsOps treats governance as a first-class concern: who can publish, what readers see, and
        how changes become official – built into the product, not bolted on.
      </Text>
    </Stack>
  );
}
