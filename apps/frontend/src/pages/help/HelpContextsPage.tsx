import { Anchor, List, Stack, Text, Title } from '@mantine/core';
import { Link } from 'react-router-dom';

export function HelpContextsPage() {
  return (
    <Stack gap="sm" align="stretch" style={{ textAlign: 'left' }}>
      <Stack gap={6}>
        <Title order={2}>Processes & projects</Title>
        <Text>
          Documents live in a <strong>context</strong>: a <strong>process</strong>, a{' '}
          <strong>project</strong>, or a <strong>subcontext</strong> under a project. Choosing the
          right kind keeps knowledge easy to find. After reading this page you should know when to
          use which context, what typically belongs inside, how to name it, and how to tell whether
          something fits an existing context.
        </Text>
      </Stack>

      <Stack gap={6}>
        <Title order={3}>Two questions</Title>
        <List spacing="xs">
          <List.Item>
            <strong>Process</strong> – Is there a clear <strong>trigger</strong>? Ask:{' '}
            <em>What do we do when …?</em> (for example when someone joins, when a customer reports
            a problem, when we need shared access rules).
          </List.Item>
          <List.Item>
            <strong>Project</strong> – Is there a clear <strong>subject</strong>? Ask:{' '}
            <em>What do we know about …?</em> (a product, initiative, or workstream you are building
            or running).
          </List.Item>
        </List>
      </Stack>

      <Stack gap={6}>
        <Title order={3}>What belongs inside</Title>
        <Text>
          A <strong>process</strong> holds reusable guidance for that trigger: roles, steps,
          checklists, and principles that stay useful across many concrete cases.
        </Text>
        <Text>
          A <strong>project</strong> holds knowledge <strong>about the subject</strong>: structure,
          decisions, and subject-specific operational detail (for example how that particular
          subject is deployed or supported).
        </Text>
        <Text>
          <strong>Subcontexts</strong> are optional folders <strong>under a project only</strong>.
          Use them to split document spaces without creating another top-level project. They are
          named areas, not a second process/project system.
        </Text>
      </Stack>

      <Stack gap={6}>
        <Title order={3}>Naming</Title>
        <List spacing="xs">
          <List.Item>
            Name a <strong>process</strong> after the <strong>trigger</strong> (for example{' '}
            <em>When a new teammate joins</em>).
          </List.Item>
          <List.Item>
            Name a <strong>project</strong> after the <strong>subject</strong>.
          </List.Item>
          <List.Item>
            Avoid creating both a process and a project for the <strong>same subject</strong>.
          </List.Item>
        </List>
      </Stack>

      <Stack gap={6}>
        <Title order={3}>Does it belong in an existing context?</Title>
        <List spacing="xs">
          <List.Item>
            Same trigger or same subject as an existing context → put the document{' '}
            <strong>there</strong>.
          </List.Item>
          <List.Item>
            Detail that only applies to one subject → prefer the <strong>project</strong> (or a
            subcontext under it), not a new process named after that subject.
          </List.Item>
          <List.Item>
            Unsure → follow the <strong>subject</strong> (choose or create a project) rather than
            inventing a vague process.
          </List.Item>
        </List>
      </Stack>

      <Stack gap={6}>
        <Title order={3}>Document shape is not context kind</Title>
        <Text>
          How a document is written (step-by-step guide, policy, decision record, and so on) does{' '}
          <strong>not</strong> decide whether the context is a process or a project. Trigger vs
          subject does. You can use the same document form in either kind of context.
        </Text>
        <Text>
          Scopes (company, department, team, personal) decide <strong>ownership and access</strong>.
          They do not replace the process vs project choice – see{' '}
          <Anchor component={Link} to="/help/organisation">
            Organisation & scopes
          </Anchor>
          .
        </Text>
      </Stack>
    </Stack>
  );
}
