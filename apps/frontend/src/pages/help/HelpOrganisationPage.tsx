import { Anchor, Stack, Text, Title } from '@mantine/core';
import { Link } from 'react-router-dom';

export function HelpOrganisationPage() {
  return (
    <Stack gap={0} align="stretch" style={{ textAlign: 'left' }}>
      <Title order={1}>Organisation & scopes</Title>
      <Text component="p">
        Content is grouped by <strong>scope</strong>: typically company, then department, then team.
        You may also have a <strong>personal</strong> area for your own drafts and contexts. The
        catalog and navigation reflect where you have access.
      </Text>
      <Title order={2}>Contexts in a scope</Title>
      <Text component="p">
        Within a scope you create <strong>processes</strong> and <strong>projects</strong> (and
        optional subcontexts under projects). For when to use which, how to name them, and what
        belongs inside, see{' '}
        <Anchor component={Link} to="/help/contexts">
          Processes & projects
        </Anchor>
        .
      </Text>
    </Stack>
  );
}
