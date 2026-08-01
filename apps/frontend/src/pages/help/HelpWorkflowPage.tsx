import { List, Stack, Text, Title } from '@mantine/core';

export function HelpWorkflowPage() {
  return (
    <Stack gap={0} align="stretch" style={{ textAlign: 'left' }}>
      <Title order={1}>Document lifecycle</Title>
      <Text component="p">
        Documents generally move from an initial draft through collaboration and quality gates to a
        published state. The labels in the product may vary slightly, but the idea is consistent.
      </Text>
      <List type="ordered" spacing="sm">
        <List.Item>
          <strong>Draft</strong> – Start a draft in a context you can write to. The draft is yours
          or your team&apos;s working copy until it is published or shared as your process defines.
        </List.Item>
        <List.Item>
          <strong>Edit</strong> – Update content, titles, and metadata. Version history helps you
          see what changed over time.
        </List.Item>
        <List.Item>
          <strong>Review</strong> – When enabled, reviewers can comment or approve so changes meet
          bar for accuracy and compliance before they land in the canonical published line.
        </List.Item>
        <List.Item>
          <strong>Merge / publish</strong> – Accepted changes are integrated into the published
          document (or a new published version), so readers see a stable, reviewed result rather
          than every keystroke in progress.
        </List.Item>
      </List>
      <Text component="p">
        Archiving and trash are separate lifecycle steps for retiring or recovering content.
      </Text>
    </Stack>
  );
}
