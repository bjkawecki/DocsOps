import { List, Stack, Text, Title } from '@mantine/core';

export function HelpPermissionsPage() {
  return (
    <Stack gap={0} align="stretch" style={{ textAlign: 'left' }}>
      <Title order={1}>Read & write access</Title>
      <Text component="p">
        Access follows where a process or project <strong>lives</strong> in the organisation (its
        owner scope) and your role in that scope. You will only see contexts and documents you are
        allowed to read.
      </Text>
      <Title order={2}>Read vs write</Title>
      <List spacing="xs">
        <List.Item>
          <strong>Read</strong> lets you open documents and context pages in that scope.
        </List.Item>
        <List.Item>
          <strong>Write</strong> lets you create and edit drafts, run actions that change content,
          and participate in workflows you are assigned to (such as reviews), subject to your
          organisation&apos;s rules.
        </List.Item>
      </List>
      <Text component="p">
        Company leads and administrators can have broader management capabilities (for example
        archiving or trash). Exact rules depend on your deployment and role configuration.
      </Text>
    </Stack>
  );
}
