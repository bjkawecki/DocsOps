import { Anchor, Stack, Text, Title } from '@mantine/core';
import { Link } from 'react-router-dom';

export function HelpOverviewPage() {
  return (
    <Stack gap={6} align="stretch" style={{ textAlign: 'left' }}>
      <Title order={2}>What is DocsOps?</Title>
      <Text>
        DocsOps is a documentation and knowledge workspace for engineering organisations. You work
        in scoped areas (company, department, team, or personal space), create documents in
        processes or projects, and move work through review and publication when your organisation
        uses that workflow.
      </Text>
      <Text>
        Choosing between a <strong>process</strong> and a <strong>project</strong> is covered in{' '}
        <Anchor component={Link} to="/help/contexts">
          Processes & projects
        </Anchor>
        . What does <strong>not</strong> belong here is covered in{' '}
        <Anchor component={Link} to="/help/out-of-scope">
          What DocsOps is not
        </Anchor>
        .
      </Text>
      <Text c="dimmed" fs="italic">
        DocsOps treats governance as a first-class concern: who can publish, what readers see, and
        how changes become official – built into the product, not bolted on.
      </Text>
    </Stack>
  );
}
